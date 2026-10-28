import { characterDefinitions, CharacterDefinition, CharacterPoseFrame, Species } from './CharacterDefinitions';
// Whole-character bounce after the color commit; profiles respect each silhouette.
// No timers, masks, material changes or per-frame node creation here.
export const bounceDuration = 240;
export const groupResponseDuration = 140;
// Respond while color is still arriving, rather than waiting for the bounce crest.
export const dyeExpressionProgress = .5;
export const idleUpdateInterval = 50;
export class CharacterMotion {
    readonly actor = new Laya.Sprite();
    private shadow: Laya.Sprite | null = null;
    private footX: number;
    private footY: number;
    private shadowX: number;
    private shadowY: number;
    private profile: CharacterDefinition['motion'];
    private calmFace: Laya.Sprite | null = null;
    private happyFace: Laya.Sprite | null = null;
    private blinkFace: Laya.Sprite | null = null;
    private blinkUntil = 0;
    private blinkAllowedAt = 0;
    private blinkDuration = 0;
    private blinkCooldown = 0;
    private happy = false;
    private happyUntil = 0;
    private bodyPose = 'body';
    private raisedBody = 'body';
    private poseFrames: CharacterPoseFrame[] | null = null;
    private poseFaces: NonNullable<CharacterDefinition['poses']>['faces'];
    private faceAnchor: [number, number] = [0, 0];
    private faceLayers: Laya.Sprite[] = [];
    private photoBody = 'body';
    private photoHeld = false;
    private idleStart = -1;
    private usesFrameTransforms = false;
    private maxFrameLift = 0;
    private poseDuration = 0;
    private photoPoseTime = groupResponseDuration * .5;
    private poseRenderer: ((body: string) => void) | null = null;
    get groupDuration() {
        return this.poseDuration || groupResponseDuration;
    }
    get bounceDuration() {
        return this.usesFrameTransforms ? this.poseDuration : bounceDuration;
    }
    constructor(private size: number, species: Species) {
        const definition: CharacterDefinition = characterDefinitions[species];
        this.profile = definition.motion;
        this.blinkDuration = definition.blink?.duration || 0;
        this.blinkCooldown = definition.blink?.cooldown || 0;
        this.raisedBody = definition.poses?.raisedBody || 'body';
        this.poseFrames = definition.poses?.frames || null;
        this.poseFaces = definition.poses?.faces;
        this.faceAnchor = definition.poses?.faceAnchor || [0, 0];
        this.photoBody = definition.poses?.photoBody || this.raisedBody;
        this.usesFrameTransforms = !!this.poseFrames?.some(frame => !!frame.transform);
        this.maxFrameLift = Math.max(0, ...(this.poseFrames || []).map(frame => frame.transform?.lift || 0));
        this.poseDuration = this.poseFrames?.reduce((duration, frame) => duration + frame.duration, 0) || 0;
        if (this.poseFrames) {
            let start = 0;
            for (const frame of this.poseFrames) {
                if (frame.body === this.raisedBody) {
                    this.photoPoseTime = start + frame.duration * .5;
                    break;
                }
                start += frame.duration;
            }
        }
        this.footX = size * definition.anchor[0] / definition.canvas[0];
        this.footY = size * definition.anchor[1] / definition.canvas[1];
        this.shadowX = size * definition.shadowAnchor[0] / definition.canvas[0];
        this.shadowY = size * definition.shadowAnchor[1] / definition.canvas[1];
        this.actor.name = 'character-motion';
        this.actor.size(size, size);
        this.actor.mouseEnabled = false;
        this.actor.pivot(this.footX, this.footY);
        this.reset();
    }
    attachShadow(shadow: Laya.Sprite) {
        this.shadow = shadow;
        shadow.pivot(this.shadowX, this.shadowY);
        this.reset();
    }
    attachPose(renderer: (body: string) => void) {
        this.poseRenderer = renderer;
    }
    updateIdle(now: number, seed: number) {
        if (this.photoHeld || this.bodyPose !== 'body') return;
        if (this.idleStart < 0) this.idleStart = now;
        // Stable per-cell phase and period; no random state, timers or texture switches.
        const offset = ((seed + 1) * .61803398875) % 1;
        const period = 2600 + offset * 600;
        const wave = .5 - .5 * Math.cos(now / period * Math.PI * 2 + offset * Math.PI * 2);
        const breath = wave * Math.min(1, (now - this.idleStart) / 400);
        // Compress toward the feet: even the tallest silhouette cannot move above its rest bounds.
        // Preserve normal-grid strength; modestly compensate subpixel motion in dense cells.
        const strength = Math.max(1, Math.min(1.5, 55.5 / this.size));
        this.actor.scale(1 + .0075 * strength * breath, 1 - .025 * strength * breath);
    }
    stopIdle() {
        if (this.idleStart < 0) return;
        this.idleStart = -1;
        this.actor.scale(1, 1);
        this.actor.pos(this.footX, this.footY);
    }
    restoreRestingBody() {
        this.photoHeld = false;
        this.setBodyPose('body');
    }
    private setBodyPose(body: string) {
        if (this.bodyPose === body) return;
        this.bodyPose = body;
        this.poseRenderer?.(body);
        for (const layer of this.faceLayers) this.placeFace(layer);
    }
    attachFaceLayer(layer: Laya.Sprite) {
        this.faceLayers.push(layer);
        this.placeFace(layer);
    }
    private placeFace(layer: Laya.Sprite) {
        const face = this.poseFaces?.[this.bodyPose];
        const unit = this.size / 256;
        if (face) {
            layer.pivot(this.faceAnchor[0] * unit, this.faceAnchor[1] * unit);
            layer.pos(face.center[0] * unit, face.center[1] * unit);
            layer.rotation = face.angle;
        } else {
            layer.pivot(0, 0);
            layer.pos(0, 0);
            layer.rotation = 0;
        }
    }
    private samplePose(elapsed: number, duration: number): CharacterPoseFrame | undefined {
        if (!this.poseFrames || !this.poseDuration) return;
        const time = Math.max(0, Math.min(1, elapsed / duration)) * this.poseDuration;
        let end = 0;
        for (const frame of this.poseFrames) {
            end += frame.duration;
            if (time < end) {
                this.setBodyPose(frame.body);
                return frame;
            }
        }
        this.restoreRestingBody();
    }
    private applyFrameTransform(frame: CharacterPoseFrame | undefined) {
        const transform = frame?.transform;
        if (!transform) return;
        this.actor.scale(transform.scale[0], transform.scale[1]);
        this.actor.pos(this.footX, this.footY - transform.lift * this.size / 256);
        const energy = this.maxFrameLift ? transform.lift / this.maxFrameLift : 0;
        if (this.shadow) {
            this.shadow.scale(1 - .17 * energy, 1 - .08 * energy);
            this.shadow.alpha = 1 - .18 * energy;
        }
    }
    attachExpressions(calm: Laya.Sprite, happy: Laya.Sprite, blink?: Laya.Sprite) {
        this.calmFace = calm;
        this.happyFace = happy;
        this.attachFaceLayer(calm);
        this.attachFaceLayer(happy);
        this.blinkFace = blink || null;
        if (blink) {
            this.attachFaceLayer(blink);
            blink.visible = false;
        }
        this.happy = false;
        calm.visible = true;
        happy.visible = false;
    }
    tryBlink(now: number) {
        if (!this.blinkFace || this.happy || this.photoHeld || this.bodyPose !== 'body' || this.blinkUntil || now < this.blinkAllowedAt)
            return false;
        this.blinkUntil = now + this.blinkDuration;
        this.blinkAllowedAt = now + this.blinkCooldown;
        if (this.calmFace) this.calmFace.visible = false;
        this.blinkFace.visible = true;
        return true;
    }
    stopBlink() {
        if (!this.blinkUntil) return;
        this.blinkUntil = 0;
        if (this.blinkFace) this.blinkFace.visible = false;
        if (this.calmFace) this.calmFace.visible = !this.happy;
    }
    private setHappy(value: boolean) {
        if (value) this.stopBlink();
        if (this.happy === value)
            return;
        this.happy = value;
        if (this.calmFace)
            this.calmFace.visible = !value;
        if (this.happyFace)
            this.happyFace.visible = value;
    }
    private holdHappy() {
        if (!this.happyFace)
            return;
        this.happyUntil = Laya.timer.currTimer + 350;
        this.setHappy(true);
    }
    updateExpression(now: number) {
        if (this.blinkUntil && now >= this.blinkUntil) this.stopBlink();
        if (this.happyUntil > 0 && now >= this.happyUntil) {
            this.happyUntil = 0;
            this.setHappy(false);
        }
        return this.happyUntil > now || this.blinkUntil > now;
    }
    respondToDye(progress: number) {
        if (progress >= dyeExpressionProgress)
            this.holdHappy();
    }
    update(elapsed: number) {
        this.stopIdle();
        this.stopBlink();
        if (elapsed <= 0 || elapsed >= this.bounceDuration) {
            this.settle();
            return;
        }
        const profile = this.profile;
        if (this.usesFrameTransforms) {
            this.applyFrameTransform(this.samplePose(elapsed, this.bounceDuration));
            this.holdHappy();
            return;
        }
        if (this.poseFrames)
            this.samplePose(elapsed, bounceDuration);
        else
            this.setBodyPose(elapsed >= profile.pressEnd ? this.raisedBody : 'body');
        this.holdHappy();
        let fromX = 1, fromY = 1, toX = profile.pressX, toY = profile.pressY, fromLift = 0, toLift = 0, t = elapsed / profile.pressEnd;
        if (elapsed >= profile.riseEnd) {
            fromX = profile.riseX;
            fromY = profile.riseY;
            toX = 1;
            toY = 1;
            fromLift = 1;
            toLift = 0;
            t = (elapsed - profile.riseEnd) / (bounceDuration - profile.riseEnd);
        }
        else if (elapsed >= profile.pressEnd) {
            fromX = profile.pressX;
            fromY = profile.pressY;
            toX = profile.riseX;
            toY = profile.riseY;
            fromLift = 0;
            toLift = 1;
            t = (elapsed - profile.pressEnd) / (profile.riseEnd - profile.pressEnd);
        }
        const eased = t * t * (3 - 2 * t), lift = (fromLift + (toLift - fromLift) * eased);
        this.actor.scale(fromX + (toX - fromX) * eased, fromY + (toY - fromY) * eased);
        this.actor.pos(this.footX, this.footY - Math.min(profile.liftMax, this.size * profile.liftRatio) * lift);
        if (this.shadow) {
            this.shadow.scale(1 - .08 * lift, 1 - .04 * lift);
            this.shadow.alpha = 1 - .12 * lift;
        }
    }
    respondToGroup(elapsed: number) {
        this.updateGroupResponse(elapsed, elapsed);
    }
    private updateGroupResponse(elapsed: number, poseElapsed: number) {
        this.stopIdle();
        this.stopBlink();
        if (elapsed <= 0 || elapsed >= this.groupDuration) {
            this.settle();
            return;
        }
        if (this.usesFrameTransforms) {
            this.applyFrameTransform(this.samplePose(poseElapsed, this.groupDuration));
            this.holdHappy();
            return;
        }
        if (this.poseFrames)
            this.samplePose(poseElapsed, this.groupDuration);
        else
            this.setBodyPose(this.raisedBody);
        const wave = Math.sin(Math.PI * elapsed / this.groupDuration);
        this.holdHappy();
        const energy = wave * wave;
        // A small grounded nod, quieter than a newly dyed character's bounce.
        this.actor.scale(1 + .012 * energy, 1 - .016 * energy);
        this.actor.pos(this.footX, this.footY);
        if (this.shadow) {
            this.shadow.scale(1 + .025 * energy, 1 + .012 * energy);
            this.shadow.alpha = 1;
        }
    }
    respondToVictory(elapsed: number) {
        // Other species may still be cheering; keep our completed photo pose meanwhile.
        if (elapsed >= this.groupDuration) {
            this.holdForPhoto();
            return;
        }
        // Grounded gestures may hold their peak; hop tracks land before the photo pose.
        this.updateGroupResponse(elapsed, this.usesFrameTransforms ? elapsed : Math.min(elapsed, this.photoPoseTime));
    }
    holdForPhoto() {
        if (this.photoHeld) return;
        this.settle();
        this.setBodyPose(this.photoBody);
        this.happyUntil = 0;
        this.setHappy(true);
        this.photoHeld = true;
    }
    reset() {
        this.stopBlink();
        this.blinkAllowedAt = 0;
        this.happyUntil = 0;
        this.setHappy(false);
        this.settle();
    }
    private settle() {
        this.stopIdle();
        this.stopBlink();
        this.restoreRestingBody();
        this.actor.scale(1, 1);
        this.actor.pos(this.footX, this.footY);
        this.actor.rotation = 0;
        if (this.shadow) {
            this.shadow.scale(1, 1);
            this.shadow.pos(this.shadowX, this.shadowY);
            this.shadow.alpha = 1;
        }
    }
}
