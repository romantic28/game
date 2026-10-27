// Whole-character bounce after the color commit; profiles respect each silhouette.
// No timers, masks, material changes or per-frame node creation here.
export const bounceDuration = 240;
export const groupResponseDuration = 140;
interface MotionProfile {
    pressEnd: number;
    riseEnd: number;
    pressX: number;
    pressY: number;
    riseX: number;
    riseY: number;
    liftRatio: number;
    liftMax: number;
}
const profiles: Record<'horn' | 'cyclops' | 'rabbit', MotionProfile> = {
    horn: { pressEnd: 60, riseEnd: 150, pressX: 1.022, pressY: .97, riseX: .99, riseY: 1.025, liftRatio: .025, liftMax: 2.2 },
    // The cyclops crest nearly touches the top of its canvas: favor squash over lift.
    cyclops: { pressEnd: 70, riseEnd: 155, pressX: 1.018, pressY: .955, riseX: .993, riseY: 1.004, liftRatio: .003, liftMax: .2 },
    // Tall rabbit ears stay in the body layer and need less vertical overshoot.
    rabbit: { pressEnd: 50, riseEnd: 135, pressX: 1.018, pressY: .977, riseX: .992, riseY: 1.014, liftRatio: .018, liftMax: 1.7 }
};
export class CharacterMotion {
    readonly actor = new Laya.Sprite();
    private shadow: Laya.Sprite | null = null;
    private footX: number;
    private footY: number;
    private shadowX: number;
    private shadowY: number;
    private profile: MotionProfile;
    private calmFace: Laya.Sprite | null = null;
    private happyFace: Laya.Sprite | null = null;
    private happy = false;
    private happyUntil = 0;
    constructor(private size: number, species: 'horn' | 'cyclops' | 'rabbit') {
        this.profile = profiles[species];
        this.footX = size * .5;
        this.footY = size * 228 / 256;
        this.shadowX = size * .5;
        this.shadowY = size * 238 / 256;
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
    attachExpressions(calm: Laya.Sprite, happy: Laya.Sprite) {
        this.calmFace = calm;
        this.happyFace = happy;
        this.happy = false;
        calm.visible = true;
        happy.visible = false;
    }
    private setHappy(value: boolean) {
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
        if (this.happyUntil > 0 && now >= this.happyUntil) {
            this.happyUntil = 0;
            this.setHappy(false);
        }
        return this.happyUntil > now;
    }
    update(elapsed: number) {
        if (elapsed <= 0 || elapsed >= bounceDuration) {
            this.settle();
            return;
        }
        const profile = this.profile;
        if (elapsed >= profile.pressEnd)
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
        if (elapsed <= 0 || elapsed >= groupResponseDuration) {
            this.settle();
            return;
        }
        const wave = Math.sin(Math.PI * elapsed / groupResponseDuration);
        if (elapsed >= 20)
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
    reset() {
        this.happyUntil = 0;
        this.setHappy(false);
        this.settle();
    }
    private settle() {
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
