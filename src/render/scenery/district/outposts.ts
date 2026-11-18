import type { Scene } from "@babylonjs/core/scene.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { bellgateBelfryFooting } from "../../../game/course/bellgate-belfry.ts";
import type { Course } from "../../../game/course/course.ts";
import { UrbanParts } from "../urban-parts.ts";
import { drawLighthouseFoundation, farm, forestLodge, lighthouse, timberYard } from "./rural-sites.ts";
import { aqueduct, clocktower, mission, theatre } from "./stone-sites.ts";
import { depot, habitat, lookout, mine } from "./working-sites.ts";
import { guardian, ruinedForum } from "./aegean-sites.ts";
import { bellgateMarket } from "./bellgate-buildings.ts";
import { aegeanTemple } from "./greek-monuments.ts";

export function drawOutposts(scene: Scene, course: Course): Mesh[] {
    if (!course.outposts.length) return [];
    const parts = new UrbanParts(scene);
    const build = parts.add;
    for (const site of course.outposts) {
        switch (site.kind) {
            case "farm":
            case "cabins": farm(build, course, site); break;
            case "timber yard": timberYard(build, course, site); break;
            case "lodge": forestLodge(build, course, site); break;
            case "lighthouse":
                if (course.track.id === "coast") drawLighthouseFoundation(build, course, site);
                else lighthouse(build, course, site);
                break;
            case "aqueduct": aqueduct(build, course, site); break;
            case "clocktower": {
                const belfry = course.biomeLandmarks.find(landmark => landmark.kind === "bellgate-belfry");
                if (belfry) {
                    const foundation = bellgateBelfryFooting(belfry);
                    build("Bellgate tower", foundation, "#d5b998");
                    build("Bellgate coping", { ...foundation, y: foundation.y + foundation.sy / 2 + 0.02, sx: foundation.sx + 0.27, sy: 0.18,
                        sz: foundation.sz + 0.25 }, "#f3d9b2");
                } else clocktower(build, site);
                break;
            }
            case "mission": mission(build, site); break;
            case "theatre": theatre(build, course, site); break;
            case "guardian": guardian(build, site); break;
            case "forum": ruinedForum(build, course, site); break;
            case "market": bellgateMarket(build, course, site); break;
            case "temple": aegeanTemple(build, course, site); break;
            case "depot": depot(build, course, site); break;
            case "habitat": habitat(build, course, site); break;
            case "lookout": lookout(build, site); break;
            case "mine": mine(build, site); break;
        }
    }
    return parts.draw();
}
