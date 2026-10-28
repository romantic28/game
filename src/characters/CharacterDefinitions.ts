// Data only: runtime and outer production tools consume this single definition.
// Coordinates describe already registered full canvases; never reposition individual PNGs.
export interface CharacterPoseFrame {
    body: string;
    duration: number;
    // Registered-canvas units, independent of rendered cell size.
    transform?: { scale: [number, number]; lift: number };
}
export interface CharacterDefinition {
    name: string;
    directory: string;
    canvas: [number, number];
    anchor: [number, number];
    shadowAnchor: [number, number];
    layers: { id: string; kind: 'color' | 'shadow' | 'fixed'; parent: 'tile' | 'actor' }[];
    fixed: string[];
    expressions: { calm: string[]; happy: string[] };
    blink?: { files: string[]; duration: number; cooldown: number };
    // Optional body variant, used only after dye completion or for group response.
    poses?: {
        raisedBody: string;
        frames?: CharacterPoseFrame[];
        faces?: Record<string, { center: [number, number]; angle: number }>;
        faceAnchor?: [number, number];
        photoBody?: string;
        // Body pixels in these registered rectangles must match the resting pose.
        lockedRegions?: [number, number, number, number][];
    };
    motion: {
        pressEnd: number; riseEnd: number;
        pressX: number; pressY: number; riseX: number; riseY: number;
        liftRatio: number; liftMax: number;
    };
}
export const characterColors = ['R', 'Y', 'B', 'G'] as const;
export const characterDefinitions = {
    "horn": {
        "blink": { "files": ["blink-eye-left.png"], "duration": 450, "cooldown": 10000 },
        "name": "小角怪",
        "poses": {
            "raisedBody": "raised-body",
            "frames": [
                { "body": "body", "duration": 40 },
                { "body": "open-body", "duration": 40 },
                { "body": "half-body", "duration": 45 },
                { "body": "raised-body", "duration": 55 },
                { "body": "half-body", "duration": 40 },
                { "body": "open-body", "duration": 35 },
                { "body": "body", "duration": 25 }
            ],
            "lockedRegions": [
                [64, 0, 128, 256],
                [0, 0, 256, 78],
                [0, 194, 256, 62]
            ]
        },
        "directory": "horn-restart-v2",
        "canvas": [256, 256],
        "anchor": [128, 228],
        "shadowAnchor": [128, 238],
        "layers": [
            { "id": "tile", "kind": "color", "parent": "tile" },
            { "id": "shadow", "kind": "shadow", "parent": "tile" },
            { "id": "body", "kind": "color", "parent": "actor" },
            { "id": "fixed", "kind": "fixed", "parent": "actor" }
        ],
        "fixed": ["horn-left", "horn-right", "cheek-left", "cheek-right"],
        "expressions": { "calm": ["calm-face.png"], "happy": ["eye-left.png","eye-right.png","mouth.png"] },
        "motion": {
            "pressEnd": 60,
            "riseEnd": 150,
            "pressX": 1.022,
            "pressY": 0.97,
            "riseX": 0.99,
            "riseY": 1.025,
            "liftRatio": 0.025,
            "liftMax": 2.2
        }
    },
    "cyclops": {
        "blink": { "files": ["blink-eye.png"], "duration": 200, "cooldown": 10000 },
        "name": "独眼怪",
        "directory": "cyclops-v2",
        "canvas": [256, 256],
        "anchor": [128, 228],
        "shadowAnchor": [128, 238],
        "layers": [
            { "id": "tile", "kind": "color", "parent": "tile" },
            { "id": "shadow", "kind": "shadow", "parent": "tile" },
            { "id": "body", "kind": "color", "parent": "actor" },
            { "id": "fixed", "kind": "fixed", "parent": "actor" }
        ],
        "fixed": ["mouth", "cheek-left", "cheek-right"],
        "expressions": { "calm": ["eye.png"], "happy": ["happy-eye.png"] },
        "motion": {
            "pressEnd": 70,
            "riseEnd": 155,
            "pressX": 1.018,
            "pressY": 0.955,
            "riseX": 0.993,
            "riseY": 1.004,
            "liftRatio": 0.003,
            "liftMax": 0.2
        }
    },
    "rabbit": {
        "blink": { "files": ["blink-eyes.png"], "duration": 180, "cooldown": 10000 },
        "poses": {
            "faceAnchor": [128, 141],
            "raisedBody": "air-body",
            "photoBody": "takeoff-body",
            "frames": [
                { "body": "body", "duration": 35, "transform": {"scale":[1,1],"lift":0} },
                { "body": "body", "duration": 45, "transform": {"scale":[1.025,0.965],"lift":0} },
                { "body": "takeoff-body", "duration": 35, "transform": {"scale":[1,1],"lift":1} },
                { "body": "air-body", "duration": 35, "transform": {"scale":[1,1],"lift":5} },
                { "body": "air-body", "duration": 55, "transform": {"scale":[1,1],"lift":9} },
                { "body": "air-body", "duration": 35, "transform": {"scale":[1,1],"lift":5} },
                { "body": "takeoff-body", "duration": 30, "transform": {"scale":[1,1],"lift":0} },
                { "body": "land-body", "duration": 40, "transform": {"scale":[1,1],"lift":0} },
                { "body": "body", "duration": 30, "transform": {"scale":[1.008,0.992],"lift":0} },
                { "body": "body", "duration": 20, "transform": {"scale":[1,1],"lift":0} }
            ],
            "faces": {
                "takeoff-body": { "center": [128,141], "angle": 2 },
                "air-body": { "center": [128,142], "angle": 12 },
                "land-body": { "center": [128,145], "angle": -2 }
            }
        },
        "name": "兔耳怪",
        "directory": "rabbit-v2",
        "canvas": [256, 256],
        "anchor": [128, 228],
        "shadowAnchor": [128, 238],
        "layers": [
            { "id": "tile", "kind": "color", "parent": "tile" },
            { "id": "shadow", "kind": "shadow", "parent": "tile" },
            { "id": "body", "kind": "color", "parent": "actor" },
            { "id": "fixed", "kind": "fixed", "parent": "actor" }
        ],
        "fixed": ["mouth", "cheek-left", "cheek-right"],
        "expressions": { "calm": ["calm-eyes.png"], "happy": ["eye-left.png","eye-right.png"] },
        "motion": {
            "pressEnd": 50,
            "riseEnd": 135,
            "pressX": 1.018,
            "pressY": 0.977,
            "riseX": 0.992,
            "riseY": 1.014,
            "liftRatio": 0.018,
            "liftMax": 1.7
        }
    }
} satisfies Record<string, CharacterDefinition>;
export type Species = keyof typeof characterDefinitions;
export const speciesList = Object.keys(characterDefinitions) as Species[];

// Shared with outer production tools; no engine dependencies or I/O.
export function poseBodyParts(definition: CharacterDefinition): string[] {
    if (!definition.poses) return [];
    return [...new Set([definition.poses.raisedBody, ...(definition.poses.frames || []).map(frame => frame.body)])].filter(part => part !== 'body');
}
