import type { Point } from "../point.ts";
import type { TrackSpec } from "./tracks.ts";
import { alpineLift } from "./alpine-lift.ts";
import type { AlpineLift } from "./alpine-lift.ts";
import { placeAqueduct } from "./aqueduct.ts";
import { aresCutworks } from "./ares-cutworks.ts";
import type { AresCutworks } from "./ares-cutworks.ts";
import { aresGardens } from "./ares-gardens.ts";
import type { AresGardens } from "./ares-gardens.ts";
import { auroraGarden } from "./aurora-garden.ts";
import { auroraWaterside } from "./aurora-waterside.ts";
import type { AuroraWaterside } from "./aurora-waterside.ts";
import { frosthavenHarbor } from "./frosthaven/harbor.ts";
import type { FrosthavenHarbor } from "./frosthaven/harbor.ts";
import { winterCabins } from "./winter-cabins.ts";
import type { WinterCabin } from "./winter-cabins.ts";
import type { Aqueduct } from "./aqueduct.ts";
import { placeBoostStrips } from "./boost-strips.ts";
import type { BoostStrip } from "./boost-strips.ts";
import { placeBiomeLandmarks } from "./biome-landmarks.ts";
import type { BiomeLandmark } from "./biome-landmarks.ts";
import { placeBarriers } from "./barriers.ts";
import type { Barrier } from "./barriers.ts";
import { streetFrontage } from "./city-frontage.ts";
import type { StreetBuilding } from "./city-frontage.ts";
import { forestBridge } from "./forest-bridge.ts";
import type { ForestBridge } from "./forest-bridge.ts";
import { placeForestMill } from "./forest-mill.ts";
import type { ForestMill } from "./forest-mill.ts";
import { forestSpillway } from "./forest-spillway.ts";
import type { ForestSpillway } from "./forest-spillway.ts";
import { CircuitLine } from "./circuit-line.ts";
import type { RaceDirection } from "./circuit-line.ts";
import { masonryBridge } from "./masonry-bridge.ts";
import { GroundHeight } from "./ground-height.ts";
import { glasswaterRiverworks } from "./glasswater-riverworks.ts";
import type { GlasswaterRiverworks } from "./glasswater-riverworks.ts";
import { glasswaterFlyover } from "./glasswater-flyover.ts";
import { placeTownGate } from "./town-gate.ts";
import { bellgateStreets } from "./bellgate-streets.ts";
import type { BellgateStreets } from "./bellgate-streets.ts";
import type { TownGate } from "./town-gate.ts";
import { coursePassages } from "./passages.ts";
import type { Passage } from "./passages.ts";
import { buildRoute } from "./route.ts";
import type { RouteLocation, RouteSample } from "./route.ts";
import { cloudfoldScenery } from "./sky-masonry.ts";
import type { CloudfoldScenery } from "./sky-masonry.ts";
import { SkyBranch } from "./sky-branch.ts";
import { rampedRibbon, ribbonSurfaces, SKY_GAP } from "./sky-ribbon.ts";
import { courseSurfaces, driveableSurfaces } from "./surfaces.ts";
import type { CourseSurfaces } from "./surfaces.ts";
import { circuitCenter } from "./terrain-profile.ts";
import { courseWater } from "./water.ts";
import type { WaterBody } from "./water.ts";
import { CalderaRunoff } from "./caldera-runoff.ts";
import { calderaBridge, calderaBridgePiers } from "./caldera-bridge.ts";
import { calderaAshworks } from "./caldera-ashworks.ts";
import type { CalderaAshworks } from "./caldera-ashworks.ts";
import { calderaCrater } from "./caldera-crater.ts";
import type { CalderaCrater } from "./caldera-crater.ts";
import { calderaRidges } from "./caldera-ridges.ts";
import { lavaEscarpment } from "./lava-escarpment.ts";
import { buildStuntLoops } from "./stunt/loop.ts";
import type { StuntLoop } from "./stunt/loop.ts";
import { buildSkywheelGrounds } from "./stunt/grounds.ts";
import type { SkywheelGrounds } from "./stunt/grounds.ts";
import { juniperTerraceWalls } from "./railway/terrace-walls.ts";
import { buildViaduct } from "./railway/viaduct.ts";
import { reefPortalStonework, reefTunnel } from "./reef-tunnel.ts";
import type { Surface } from "./surface.ts";
import { placeHalls } from "./halls.ts";
import type { Hall } from "./halls.ts";
import { placeOutposts } from "./outposts.ts";
import type { Outpost } from "./outposts.ts";
import { placeRockFormations } from "./rock-formations.ts";
import type { RockFormation } from "./rock-formations.ts";
import { placeRockShelter } from "./rock-shelters.ts";
import type { RockShelter } from "./rock-shelters.ts";
import { growCourse } from "./vegetation/layout.ts";
import type { Vegetation } from "./vegetation/layout.ts";

export class Course {
    readonly track: TrackSpec;
    readonly #forward: CircuitLine;
    #backward: CircuitLine | undefined;
    readonly center: Point;
    readonly surfaces: CourseSurfaces;
    readonly ground: GroundHeight;
    readonly aresCutworks: AresCutworks | undefined;
    readonly aresGardens: AresGardens | undefined;
    readonly auroraWaterside: AuroraWaterside | undefined;
    readonly glasswaterRiverworks: GlasswaterRiverworks | undefined;
    readonly glasswaterFlyover: ReturnType<typeof glasswaterFlyover> | undefined;
    readonly boostStrips: readonly BoostStrip[];
    readonly branch: SkyBranch | undefined;
    readonly water: readonly WaterBody[];
    readonly lift: AlpineLift | undefined;
    readonly lavaEscarpment: Surface | undefined;
    readonly calderaRunoff: CalderaRunoff | undefined;
    readonly calderaCrater: CalderaCrater | undefined;
    readonly calderaAshworks: CalderaAshworks | undefined;
    readonly calderaRidges: Surface | undefined;
    readonly copperCrossing: Surface | undefined;
    readonly frosthavenCrossing: Surface | undefined;
    readonly calderaCrossing: readonly [arches: Surface, piers: Surface] | undefined;
    readonly stuntLoops: readonly StuntLoop[];
    readonly skywheelGrounds: SkywheelGrounds | undefined;
    readonly juniperTerraces: Surface | undefined;
    readonly railwayViaduct: ReturnType<typeof buildViaduct> | undefined;
    readonly reefTunnel: Surface | undefined;
    readonly reefPortalStonework: Surface | undefined;
    readonly cloudfoldScenery: CloudfoldScenery | undefined;
    readonly skygarden: ReturnType<typeof auroraGarden> | undefined;
    readonly passages: readonly Passage[];
    readonly bellgateStreets: BellgateStreets | undefined;
    readonly townGate: TownGate | undefined;
    readonly aqueduct: Aqueduct | undefined;
    readonly halls: readonly Hall[];
    readonly biomeLandmarks: readonly BiomeLandmark[];
    readonly rockFormations: readonly RockFormation[];
    readonly shelter: RockShelter | undefined;
    readonly outposts: readonly Outpost[];
    readonly streetBuildings: readonly StreetBuilding[];
    readonly forestBridge: ForestBridge | undefined;
    readonly forestSpillway: ForestSpillway | undefined;
    readonly forestMill: ForestMill | undefined;
    readonly frosthavenHarbor: FrosthavenHarbor | undefined;
    readonly winterCabins: readonly WinterCabin[];
    readonly vegetation: Vegetation;
    readonly barriers: readonly Barrier[];

    constructor(track: TrackSpec) {
        this.track = track;
        this.passages = coursePassages(track.id);
        const baseRoute = buildRoute(track);
        const gap = track.id === "sky" ? SKY_GAP : undefined;
        this.branch = gap ? new SkyBranch(baseRoute) : undefined;
        const route = gap ? rampedRibbon(baseRoute, gap) : baseRoute;
        this.#forward = new CircuitLine(route, gap && { gap, stacked: true });
        if (this.length < 400) throw new Error("Circuit is too short: " + track.name);
        this.center = circuitCenter(track.points);
        this.water = courseWater(track.id, route, this.center);
        this.surfaces = gap ? ribbonSurfaces(route, gap, this.branch!.deck) : courseSurfaces(track, route, this.center, this.water);
        this.ground = new GroundHeight(driveableSurfaces(this.surfaces));
        this.aresCutworks = track.id === "mars" ? aresCutworks(this) : undefined;
        const creek = this.water.find(body => body.kind === "creek");
        this.glasswaterRiverworks = track.id === "metro" && creek ? glasswaterRiverworks(this, creek) : undefined;
        this.auroraWaterside = track.id === "future" && creek ? auroraWaterside(this, creek) : undefined;
        this.lift = track.id === "alpine" ? alpineLift(this) : undefined;
        const flyover = track.id === "metro" && this.passages.find(passage => passage.kind === "flyover");
        this.glasswaterFlyover = flyover ? glasswaterFlyover(this, this.at(flyover.distance)) : undefined;
        this.reefTunnel = reefTunnel(this);
        this.reefPortalStonework = reefPortalStonework(this);
        this.cloudfoldScenery = this.branch && cloudfoldScenery(this, this.branch);
        this.skygarden = track.id === "future" ? auroraGarden(this) : undefined;
        this.stuntLoops = buildStuntLoops(this);
        this.skywheelGrounds = track.id === "stunt" ? buildSkywheelGrounds(this) : undefined;
        this.railwayViaduct = track.id === "rail" ? buildViaduct(this.ground) : undefined;
        this.juniperTerraces = track.id === "rail" ? juniperTerraceWalls(this) : undefined;
        const lava = this.water.find(body => body.kind === "lava");
        this.lavaEscarpment = lava && lavaEscarpment(this.ground, lava);
        this.calderaCrater = lava && calderaCrater(this.ground);
        this.calderaAshworks = track.id === "caldera" ? calderaAshworks(this) : undefined;
        this.calderaRidges = lava && calderaRidges(this.ground);
        const crossing = lava && this.passages.find(passage => passage.kind === "bridge");
        this.calderaCrossing = crossing && [calderaBridge(this, crossing.distance), calderaBridgePiers(this, crossing.distance)];
        this.calderaRunoff = lava && new CalderaRunoff(this.ground, lava, this.calderaCrater!);
        const stoneCrossing = (track.id === "gorge" || track.id === "arctic") &&
            this.passages.find(passage => passage.kind === "bridge");
        const bridge = stoneCrossing ? masonryBridge(this, stoneCrossing.distance) : undefined;
        this.copperCrossing = track.id === "gorge" ? bridge : undefined;
        this.frosthavenCrossing = track.id === "arctic" ? bridge : undefined;
        const forestCrossing = track.id === "forest" && this.passages.find(passage => passage.kind === "bridge");
        this.forestBridge = forestCrossing ? forestBridge(this, forestCrossing.distance) : undefined;
        const forestLake = track.id === "forest" ? this.water.find(body => body.kind === "lake") : undefined;
        this.forestSpillway = forestLake && forestSpillway(this, forestLake);
        this.forestMill = forestLake && placeForestMill(forestLake, this.ground);
        const gate = this.passages.find(passage => passage.kind === "town gate");
        this.bellgateStreets = gate && bellgateStreets(this);
        this.townGate = gate && placeTownGate(this.at(gate.distance), this.ground);
        this.boostStrips = placeBoostStrips(this);
        this.aqueduct = placeAqueduct(this);
        this.halls = placeHalls(this);
        this.shelter = placeRockShelter(this);
        this.outposts = placeOutposts(this);
        this.rockFormations = placeRockFormations(this);
        this.frosthavenHarbor = frosthavenHarbor(this);
        this.winterCabins = winterCabins(this);
        this.streetBuildings = streetFrontage(this);
        this.biomeLandmarks = placeBiomeLandmarks(this);
        this.aresGardens = track.id === "mars" ? aresGardens(this) : undefined;
        this.vegetation = growCourse(this);
        const barriers = placeBarriers(track, this.#forward, this.passages, this.branch);
        this.barriers = this.branch ? [...barriers, ...this.branch.barriers] : barriers;
    }

    get route(): readonly RouteSample[] { return this.#forward.route; }
    get length(): number { return this.#forward.length; }
    get gates(): readonly RouteSample[] { return this.#forward.gates; }
    get startLine(): RouteSample { return this.#forward.startLine; }
    get start(): RouteSample { return this.#forward.start; }
    get gap(): CircuitLine["gap"] { return this.#forward.gap; }

    at(distance: number): RouteSample {
        return this.#forward.at(distance);
    }

    locate(position: Point): RouteLocation {
        return this.#forward.locate(position);
    }

    isGap(distance: number, padding = 0): boolean {
        return this.#forward.isGap(distance, padding);
    }

    raceLine(direction: RaceDirection): CircuitLine {
        if (direction === "forward") return this.#forward;
        this.#backward ??= this.#forward.reversed();
        return this.#backward;
    }
}
