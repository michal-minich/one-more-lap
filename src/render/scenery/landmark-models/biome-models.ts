import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { BiomeLandmarkKind } from "../../../game/course/biome-landmarks.ts";
import type { Course } from "../../../game/course/course.ts";
import { material } from "../../materials.ts";
import { fromPacked, unpackMeshes } from "../../packed-mesh.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";

import aresBrecciaMesh from "./biomes/ares-breccia.bin?inline";
import aresBrecciaColor from "./biomes/ares-breccia.jpg?inline";
import calderaSpatterMesh from "./biomes/caldera-spatter.bin?inline";
import calderaSpatterColor from "./biomes/caldera-spatter.jpg?inline";
import cinderHoodooMesh from "./biomes/cinder-hoodoo.bin?inline";
import cinderHoodooColor from "./biomes/cinder-hoodoo.jpg?inline";
import copperMesaMesh from "./biomes/copper-mesa.bin?inline";
import copperMesaColor from "./biomes/copper-mesa.jpg?inline";
import windbreakOakMesh from "./biomes/windbreak-oak.bin?inline";
import windbreakOakColor from "./biomes/windbreak-oak.jpg?inline";

import aegeanRuinMesh from "./biomes/aegean-ruin.bin?inline";
import aegeanRuinColor from "./biomes/aegean-ruin.jpg?inline";

import pacificCypressMesh from "./biomes/pacific-cypress.bin?inline";
import pacificCypressColor from "./biomes/pacific-cypress.jpg?inline";

import alpineScreeMesh from "./biomes/alpine-scree.bin?inline";
import alpineScreeColor from "./biomes/alpine-scree.jpg?inline";

import bellgateFountainMesh from "./biomes/bellgate-fountain.bin?inline";
import bellgateFountainColor from "./biomes/bellgate-fountain.jpg?inline";

import glasswaterPlanterMesh from "./biomes/glasswater-planter.bin?inline";
import glasswaterPlanterColor from "./biomes/glasswater-planter.jpg?inline";

import auroraGardenMesh from "./biomes/aurora-garden.bin?inline";
import auroraGardenColor from "./biomes/aurora-garden.jpg?inline";

import frosthavenIceMesh from "./biomes/frosthaven-ice.bin?inline";
import frosthavenIceColor from "./biomes/frosthaven-ice.jpg?inline";

import cloudfoldRockMesh from "./biomes/cloudfold-rock.bin?inline";
import cloudfoldRockColor from "./biomes/cloudfold-rock.jpg?inline";

import coralFanMesh from "./biomes/coral-fan.bin?inline";
import coralFanColor from "./biomes/coral-fan.jpg?inline";

import skywheelMarqueeMesh from "./biomes/skywheel-marquee.bin?inline";
import skywheelMarqueeColor from "./biomes/skywheel-marquee.jpg?inline";

import blackwoodSlateMesh from "./woodland/blackwood-slate.bin?inline";
import blackwoodSlateColor from "./woodland/blackwood-slate.jpg?inline";

import blackwoodCedarMesh from "./woodland/blackwood-cedar.bin?inline";
import blackwoodCedarColor from "./woodland/blackwood-cedar.jpg?inline";

import blackwoodLodgeMesh from "./woodland/blackwood-lodge.bin?inline";
import blackwoodLodgeColor from "./woodland/blackwood-lodge.jpg?inline";

import blackwoodPierMesh from "./woodland/blackwood-pier.bin?inline";
import blackwoodPierColor from "./woodland/blackwood-pier.jpg?inline";

import blackwoodFernMesh from "./woodland/blackwood-fern.bin?inline";
import blackwoodFernColor from "./woodland/blackwood-fern.jpg?inline";

import blackwoodShelterMesh from "./woodland/blackwood-shelter.bin?inline";
import blackwoodShelterColor from "./woodland/blackwood-shelter.jpg?inline";

import blackwoodMillMesh from "./woodland/blackwood-mill.bin?inline";
import blackwoodMillColor from "./woodland/blackwood-mill.jpg?inline";

import aegeanShrineMesh from "./aegean/aegean-shrine.bin?inline";
import aegeanShrineColor from "./aegean/aegean-shrine.jpg?inline";

import aegeanOliveMesh from "./aegean/aegean-olive.bin?inline";
import aegeanOliveColor from "./aegean/aegean-olive.jpg?inline";

import aegeanEntablatureMesh from "./aegean/aegean-entablature.bin?inline";
import aegeanEntablatureColor from "./aegean/aegean-entablature.jpg?inline";

import aegeanPillarMesh from "./aegean/aegean-pillar.bin?inline";
import aegeanPillarColor from "./aegean/aegean-pillar.jpg?inline";

import aegeanBenchMesh from "./aegean/aegean-bench.bin?inline";
import aegeanBenchColor from "./aegean/aegean-bench.jpg?inline";

import aegeanTuftMesh from "./aegean/aegean-tuft.bin?inline";
import aegeanTuftColor from "./aegean/aegean-tuft.jpg?inline";

import pacificMontereyMesh from "./pacific/pacific-monterey.bin?inline";
import pacificMontereyColor from "./pacific/pacific-monterey.jpg?inline";

import pacificLighthouseMesh from "./pacific/pacific-lighthouse.bin?inline";
import pacificLighthouseColor from "./pacific/pacific-lighthouse.jpg?inline";

import pacificChalkMesh from "./pacific/pacific-chalk.bin?inline";
import pacificChalkColor from "./pacific/pacific-chalk.jpg?inline";

import pacificShelterMesh from "./pacific/pacific-shelter.bin?inline";
import pacificShelterColor from "./pacific/pacific-shelter.jpg?inline";

import pacificSaplingMesh from "./pacific/pacific-sapling.bin?inline";
import pacificSaplingColor from "./pacific/pacific-sapling.jpg?inline";

import pacificThriftMesh from "./pacific/pacific-thrift.bin?inline";
import pacificThriftColor from "./pacific/pacific-thrift.jpg?inline";

import alpineStationMesh from "./alpine/alpine-station.bin?inline";
import alpineStationColor from "./alpine/alpine-station.jpg?inline";

import alpineGondolaMesh from "./alpine/alpine-gondola.bin?inline";
import alpineGondolaColor from "./alpine/alpine-gondola.jpg?inline";

import alpineLarchMesh from "./alpine/alpine-larch.bin?inline";
import alpineLarchColor from "./alpine/alpine-larch.jpg?inline";

import alpineFinMesh from "./alpine/alpine-fin.bin?inline";
import alpineFinColor from "./alpine/alpine-fin.jpg?inline";

import alpineFenceMesh from "./alpine/alpine-fence.bin?inline";
import alpineFenceColor from "./alpine/alpine-fence.jpg?inline";

import alpineShrubMesh from "./alpine/alpine-shrub.bin?inline";
import alpineShrubColor from "./alpine/alpine-shrub.jpg?inline";

import cinderValleyArchMesh from "./cinder/cinder-arch.bin?inline";
import cinderValleyArchColor from "./cinder/cinder-arch.jpg?inline";

import cinderValleyHoodooMesh from "./cinder/cinder-banded-hoodoo.bin?inline";
import cinderValleyHoodooColor from "./cinder/cinder-banded-hoodoo.jpg?inline";

import cinderValleyJuniperMesh from "./cinder/cinder-juniper.bin?inline";
import cinderValleyJuniperColor from "./cinder/cinder-juniper.jpg?inline";

import cinderValleyShadeMesh from "./cinder/cinder-shade.bin?inline";
import cinderValleyShadeColor from "./cinder/cinder-shade.jpg?inline";

import cinderValleyFlumeMesh from "./cinder/cinder-flume.bin?inline";
import cinderValleyFlumeColor from "./cinder/cinder-flume.jpg?inline";

import cinderValleySageMesh from "./cinder/cinder-sage.bin?inline";
import cinderValleySageColor from "./cinder/cinder-sage.jpg?inline";

import copperGorgeSplitMesaMesh from "./copper/copper-split-mesa.bin?inline";
import copperGorgeSplitMesaColor from "./copper/copper-split-mesa.jpg?inline";

import copperGorgeTalusMesh from "./copper/copper-talus.bin?inline";
import copperGorgeTalusColor from "./copper/copper-talus.jpg?inline";

import copperGorgeSurveyTowerMesh from "./copper/copper-survey-tower.bin?inline";
import copperGorgeSurveyTowerColor from "./copper/copper-survey-tower.jpg?inline";

import copperGorgeOreTrolleyMesh from "./copper/copper-ore-trolley.bin?inline";
import copperGorgeOreTrolleyColor from "./copper/copper-ore-trolley.jpg?inline";

import copperGorgeOreHutMesh from "./copper/copper-ore-hut.bin?inline";
import copperGorgeOreHutColor from "./copper/copper-ore-hut.jpg?inline";

import copperGorgeWildflowersMesh from "./copper/copper-wildflowers.bin?inline";
import copperGorgeWildflowersColor from "./copper/copper-wildflowers.jpg?inline";

import juniperStationMesh from "./juniper/juniper-station.bin?inline";
import juniperStationColor from "./juniper/juniper-station.jpg?inline";

import juniperTowerMesh from "./juniper/juniper-tower.bin?inline";
import juniperTowerColor from "./juniper/juniper-tower.jpg?inline";

import juniperSemaphoreMesh from "./juniper/juniper-semaphore.bin?inline";
import juniperSemaphoreColor from "./juniper/juniper-semaphore.jpg?inline";

import juniperShedMesh from "./juniper/juniper-shed.bin?inline";
import juniperShedColor from "./juniper/juniper-shed.jpg?inline";

import juniperFlowersMesh from "./juniper/juniper-flowers.bin?inline";
import juniperFlowersColor from "./juniper/juniper-flowers.jpg?inline";

import juniperOutcropMesh from "./juniper/juniper-outcrop.bin?inline";
import juniperOutcropColor from "./juniper/juniper-outcrop.jpg?inline";

import frosthavenBoathouseMesh from "./frosthaven/frosthaven-boathouse.bin?inline";
import frosthavenBoathouseColor from "./frosthaven/frosthaven-boathouse.jpg?inline";

import frosthavenBeaconMesh from "./frosthaven/frosthaven-beacon.bin?inline";
import frosthavenBeaconColor from "./frosthaven/frosthaven-beacon.jpg?inline";

import frosthavenDerrickMesh from "./frosthaven/frosthaven-derrick.bin?inline";
import frosthavenDerrickColor from "./frosthaven/frosthaven-derrick.jpg?inline";

import frosthavenIceShelfMesh from "./frosthaven/frosthaven-ice-shelf.bin?inline";
import frosthavenIceShelfColor from "./frosthaven/frosthaven-ice-shelf.jpg?inline";

import frosthavenSpruceMesh from "./frosthaven/frosthaven-spruce.bin?inline";
import frosthavenSpruceColor from "./frosthaven/frosthaven-spruce.jpg?inline";

import frosthavenCratesMesh from "./frosthaven/frosthaven-crates.bin?inline";
import frosthavenCratesColor from "./frosthaven/frosthaven-crates.jpg?inline";

import coralPalmMesh from "./coral/coral-palm.bin?inline";
import coralPalmColor from "./coral/coral-palm.jpg?inline";

import coralBommieMesh from "./coral/coral-bommie.bin?inline";
import coralBommieColor from "./coral/coral-bommie.jpg?inline";

import coralLookoutMesh from "./coral/coral-lookout.bin?inline";
import coralLookoutColor from "./coral/coral-lookout.jpg?inline";

import coralSpongesMesh from "./coral/coral-sponges.bin?inline";
import coralSpongesColor from "./coral/coral-sponges.jpg?inline";

import coralMarkerMesh from "./coral/coral-marker.bin?inline";
import coralMarkerColor from "./coral/coral-marker.jpg?inline";

import coralHibiscusMesh from "./coral/coral-hibiscus.bin?inline";
import coralHibiscusColor from "./coral/coral-hibiscus.jpg?inline";

import cloudfoldCragMesh from "./cloudfold/cloudfold-crag.bin?inline";
import cloudfoldCragColor from "./cloudfold/cloudfold-crag.jpg?inline";

import cloudfoldPavilionMesh from "./cloudfold/cloudfold-pavilion.bin?inline";
import cloudfoldPavilionColor from "./cloudfold/cloudfold-pavilion.jpg?inline";

import cloudfoldCypressMesh from "./cloudfold/cloudfold-cypress.bin?inline";
import cloudfoldCypressColor from "./cloudfold/cloudfold-cypress.jpg?inline";

import cloudfoldArmillaryMesh from "./cloudfold/cloudfold-armillary.bin?inline";
import cloudfoldArmillaryColor from "./cloudfold/cloudfold-armillary.jpg?inline";

import cloudfoldLampMesh from "./cloudfold/cloudfold-lamp.bin?inline";
import cloudfoldLampColor from "./cloudfold/cloudfold-lamp.jpg?inline";

import cloudfoldGrassesMesh from "./cloudfold/cloudfold-grasses.bin?inline";
import cloudfoldGrassesColor from "./cloudfold/cloudfold-grasses.jpg?inline";

import bellgateBelfryMesh from "./bellgate/bellgate-belfry.bin?inline";
import bellgateBelfryColor from "./bellgate/bellgate-belfry.jpg?inline";

import bellgateStallMesh from "./bellgate/bellgate-stall.bin?inline";
import bellgateStallColor from "./bellgate/bellgate-stall.jpg?inline";

import bellgateFruitCartMesh from "./bellgate/bellgate-fruit-cart.bin?inline";
import bellgateFruitCartColor from "./bellgate/bellgate-fruit-cart.jpg?inline";

import bellgateCitrusMesh from "./bellgate/bellgate-citrus.bin?inline";
import bellgateCitrusColor from "./bellgate/bellgate-citrus.jpg?inline";

import bellgateTownhouseMesh from "./bellgate/bellgate-townhouse.bin?inline";
import bellgateTownhouseColor from "./bellgate/bellgate-townhouse.jpg?inline";

import bellgateFlowerTroughMesh from "./bellgate/bellgate-flower-trough.bin?inline";
import bellgateFlowerTroughColor from "./bellgate/bellgate-flower-trough.jpg?inline";

import glasswaterFerryMesh from "./glasswater/glasswater-ferry.bin?inline";
import glasswaterFerryColor from "./glasswater/glasswater-ferry.jpg?inline";

import glasswaterCafeMesh from "./glasswater/glasswater-cafe.bin?inline";
import glasswaterCafeColor from "./glasswater/glasswater-cafe.jpg?inline";

import glasswaterCraneMesh from "./glasswater/glasswater-crane.bin?inline";
import glasswaterCraneColor from "./glasswater/glasswater-crane.jpg?inline";

import glasswaterShelterMesh from "./glasswater/glasswater-shelter.bin?inline";
import glasswaterShelterColor from "./glasswater/glasswater-shelter.jpg?inline";

import glasswaterSailMesh from "./glasswater/glasswater-sail.bin?inline";
import glasswaterSailColor from "./glasswater/glasswater-sail.jpg?inline";

import glasswaterReedsMesh from "./glasswater/glasswater-reeds.bin?inline";
import glasswaterReedsColor from "./glasswater/glasswater-reeds.jpg?inline";

import auroraSolarTreeMesh from "./aurora/aurora-solar-tree.bin?inline";
import auroraSolarTreeColor from "./aurora/aurora-solar-tree.jpg?inline";

import auroraConservatoryMesh from "./aurora/aurora-conservatory.bin?inline";
import auroraConservatoryColor from "./aurora/aurora-conservatory.jpg?inline";

import auroraServicePodMesh from "./aurora/aurora-service-pod.bin?inline";
import auroraServicePodColor from "./aurora/aurora-service-pod.jpg?inline";

import auroraGinkgoMesh from "./aurora/aurora-ginkgo.bin?inline";
import auroraGinkgoColor from "./aurora/aurora-ginkgo.jpg?inline";

import auroraSucculentMesh from "./aurora/aurora-succulent.bin?inline";
import auroraSucculentColor from "./aurora/aurora-succulent.jpg?inline";

import auroraOrbitMesh from "./aurora/aurora-orbit.bin?inline";
import auroraOrbitColor from "./aurora/aurora-orbit.jpg?inline";

import aresDishMesh from "./ares/ares-dish.bin?inline";
import aresDishColor from "./ares/ares-dish.jpg?inline";

import aresRoverMesh from "./ares/ares-rover.bin?inline";
import aresRoverColor from "./ares/ares-rover.jpg?inline";

import aresPodMesh from "./ares/ares-pod.bin?inline";
import aresPodColor from "./ares/ares-pod.jpg?inline";

import aresTankMesh from "./ares/ares-tank.bin?inline";
import aresTankColor from "./ares/ares-tank.jpg?inline";

import aresSlateMesh from "./ares/ares-slate.bin?inline";
import aresSlateColor from "./ares/ares-slate.jpg?inline";

import aresRadiatorMesh from "./ares/ares-radiator.bin?inline";
import aresRadiatorColor from "./ares/ares-radiator.jpg?inline";

import skywheelBoothMesh from "./skywheel/skywheel-booth.bin?inline";
import skywheelBoothColor from "./skywheel/skywheel-booth.jpg?inline";

import skywheelGondolaMesh from "./skywheel/skywheel-gondola.bin?inline";
import skywheelGondolaColor from "./skywheel/skywheel-gondola.jpg?inline";

import skywheelLampMesh from "./skywheel/skywheel-lamp.bin?inline";
import skywheelLampColor from "./skywheel/skywheel-lamp.jpg?inline";

import skywheelCartMesh from "./skywheel/skywheel-cart.bin?inline";
import skywheelCartColor from "./skywheel/skywheel-cart.jpg?inline";

import skywheelPlanterMesh from "./skywheel/skywheel-planter.bin?inline";
import skywheelPlanterColor from "./skywheel/skywheel-planter.jpg?inline";

import skywheelBollardMesh from "./skywheel/skywheel-bollard.bin?inline";
import skywheelBollardColor from "./skywheel/skywheel-bollard.jpg?inline";

import calderaStationMesh from "./caldera/caldera-station.bin?inline";
import calderaStationColor from "./caldera/caldera-station.jpg?inline";
import calderaStationEmissive from "./caldera/caldera-station-emissive.png?inline";

import calderaLampMesh from "./caldera/caldera-lamp.bin?inline";
import calderaLampColor from "./caldera/caldera-lamp.jpg?inline";
import calderaLampEmissive from "./caldera/caldera-lamp-emissive.png?inline";

import calderaFinsMesh from "./caldera/caldera-fins.bin?inline";
import calderaFinsColor from "./caldera/caldera-fins.jpg?inline";

import calderaRopeLavaMesh from "./caldera/caldera-rope-lava.bin?inline";
import calderaRopeLavaColor from "./caldera/caldera-rope-lava.jpg?inline";
import calderaRopeLavaEmissive from "./caldera/caldera-rope-lava-emissive.png?inline";

import calderaTussockMesh from "./caldera/caldera-tussock.bin?inline";
import calderaTussockColor from "./caldera/caldera-tussock.jpg?inline";

import calderaMarkerMesh from "./caldera/caldera-marker.bin?inline";
import calderaMarkerColor from "./caldera/caldera-marker.jpg?inline";

type DisplayOnlyLandmark = "cloudfold-rock" | "cloudfold-crag" | "cloudfold-lamp" | "coral-fan";
type AnimatedLandmark = "alpine-gondola" | "skywheel-gondola";
type ModelKind = BiomeLandmarkKind | DisplayOnlyLandmark | AnimatedLandmark;

interface BiomeAsset {
    readonly packed: string;
    readonly color: string;
    readonly emissive?: string;
}

const assets = {
    "caldera-marker": { packed: calderaMarkerMesh, color: calderaMarkerColor },
    "caldera-tussock": { packed: calderaTussockMesh, color: calderaTussockColor },
    "caldera-rope-lava": { packed: calderaRopeLavaMesh, color: calderaRopeLavaColor, emissive: calderaRopeLavaEmissive },
    "caldera-fins": { packed: calderaFinsMesh, color: calderaFinsColor },
    "caldera-lamp": { packed: calderaLampMesh, color: calderaLampColor, emissive: calderaLampEmissive },
    "caldera-station": { packed: calderaStationMesh, color: calderaStationColor, emissive: calderaStationEmissive },
    "skywheel-bollard": { packed: skywheelBollardMesh, color: skywheelBollardColor },
    "skywheel-planter": { packed: skywheelPlanterMesh, color: skywheelPlanterColor },
    "skywheel-cart": { packed: skywheelCartMesh, color: skywheelCartColor },
    "skywheel-lamp": { packed: skywheelLampMesh, color: skywheelLampColor },
    "skywheel-gondola": { packed: skywheelGondolaMesh, color: skywheelGondolaColor },
    "skywheel-booth": { packed: skywheelBoothMesh, color: skywheelBoothColor },
    "ares-radiator": { packed: aresRadiatorMesh, color: aresRadiatorColor },
    "ares-slate": { packed: aresSlateMesh, color: aresSlateColor },
    "ares-tank": { packed: aresTankMesh, color: aresTankColor },
    "ares-pod": { packed: aresPodMesh, color: aresPodColor },
    "ares-rover": { packed: aresRoverMesh, color: aresRoverColor },
    "ares-dish": { packed: aresDishMesh, color: aresDishColor },
    "aurora-orbit": { packed: auroraOrbitMesh, color: auroraOrbitColor },
    "aurora-succulent": { packed: auroraSucculentMesh, color: auroraSucculentColor },
    "aurora-ginkgo": { packed: auroraGinkgoMesh, color: auroraGinkgoColor },
    "aurora-service-pod": { packed: auroraServicePodMesh, color: auroraServicePodColor },
    "aurora-conservatory": { packed: auroraConservatoryMesh, color: auroraConservatoryColor },
    "aurora-solar-tree": { packed: auroraSolarTreeMesh, color: auroraSolarTreeColor },
    "glasswater-reeds": { packed: glasswaterReedsMesh, color: glasswaterReedsColor },
    "glasswater-sail": { packed: glasswaterSailMesh, color: glasswaterSailColor },
    "glasswater-shelter": { packed: glasswaterShelterMesh, color: glasswaterShelterColor },
    "glasswater-crane": { packed: glasswaterCraneMesh, color: glasswaterCraneColor },
    "glasswater-cafe": { packed: glasswaterCafeMesh, color: glasswaterCafeColor },
    "glasswater-ferry": { packed: glasswaterFerryMesh, color: glasswaterFerryColor },
    "bellgate-flower-trough": { packed: bellgateFlowerTroughMesh, color: bellgateFlowerTroughColor },
    "bellgate-townhouse": { packed: bellgateTownhouseMesh, color: bellgateTownhouseColor },
    "bellgate-citrus": { packed: bellgateCitrusMesh, color: bellgateCitrusColor },
    "bellgate-fruit-cart": { packed: bellgateFruitCartMesh, color: bellgateFruitCartColor },
    "bellgate-stall": { packed: bellgateStallMesh, color: bellgateStallColor },
    "bellgate-belfry": { packed: bellgateBelfryMesh, color: bellgateBelfryColor },
    "cloudfold-grasses": { packed: cloudfoldGrassesMesh, color: cloudfoldGrassesColor },
    "cloudfold-lamp": { packed: cloudfoldLampMesh, color: cloudfoldLampColor },
    "cloudfold-armillary": { packed: cloudfoldArmillaryMesh, color: cloudfoldArmillaryColor },
    "cloudfold-cypress": { packed: cloudfoldCypressMesh, color: cloudfoldCypressColor },
    "cloudfold-pavilion": { packed: cloudfoldPavilionMesh, color: cloudfoldPavilionColor },
    "cloudfold-crag": { packed: cloudfoldCragMesh, color: cloudfoldCragColor },
    "coral-hibiscus": { packed: coralHibiscusMesh, color: coralHibiscusColor },
    "coral-marker": { packed: coralMarkerMesh, color: coralMarkerColor },
    "coral-sponges": { packed: coralSpongesMesh, color: coralSpongesColor },
    "coral-lookout": { packed: coralLookoutMesh, color: coralLookoutColor },
    "coral-bommie": { packed: coralBommieMesh, color: coralBommieColor },
    "coral-palm": { packed: coralPalmMesh, color: coralPalmColor },
    "frosthaven-crates": { packed: frosthavenCratesMesh, color: frosthavenCratesColor },
    "frosthaven-spruce": { packed: frosthavenSpruceMesh, color: frosthavenSpruceColor },
    "frosthaven-ice-shelf": { packed: frosthavenIceShelfMesh, color: frosthavenIceShelfColor },
    "frosthaven-derrick": { packed: frosthavenDerrickMesh, color: frosthavenDerrickColor },
    "frosthaven-beacon": { packed: frosthavenBeaconMesh, color: frosthavenBeaconColor },
    "frosthaven-boathouse": { packed: frosthavenBoathouseMesh, color: frosthavenBoathouseColor },
    "juniper-outcrop": { packed: juniperOutcropMesh, color: juniperOutcropColor },
    "juniper-flowers": { packed: juniperFlowersMesh, color: juniperFlowersColor },
    "juniper-shed": { packed: juniperShedMesh, color: juniperShedColor },
    "juniper-semaphore": { packed: juniperSemaphoreMesh, color: juniperSemaphoreColor },
    "juniper-tower": { packed: juniperTowerMesh, color: juniperTowerColor },
    "juniper-station": { packed: juniperStationMesh, color: juniperStationColor },
    "copper-wildflowers": { packed: copperGorgeWildflowersMesh, color: copperGorgeWildflowersColor },
    "copper-ore-hut": { packed: copperGorgeOreHutMesh, color: copperGorgeOreHutColor },
    "copper-ore-trolley": { packed: copperGorgeOreTrolleyMesh, color: copperGorgeOreTrolleyColor },
    "copper-survey-tower": { packed: copperGorgeSurveyTowerMesh, color: copperGorgeSurveyTowerColor },
    "copper-talus": { packed: copperGorgeTalusMesh, color: copperGorgeTalusColor },
    "copper-split-mesa": { packed: copperGorgeSplitMesaMesh, color: copperGorgeSplitMesaColor },
    "cinder-sage": { packed: cinderValleySageMesh, color: cinderValleySageColor },
    "cinder-flume": { packed: cinderValleyFlumeMesh, color: cinderValleyFlumeColor },
    "cinder-shade": { packed: cinderValleyShadeMesh, color: cinderValleyShadeColor },
    "cinder-juniper": { packed: cinderValleyJuniperMesh, color: cinderValleyJuniperColor },
    "cinder-banded-hoodoo": { packed: cinderValleyHoodooMesh, color: cinderValleyHoodooColor },
    "cinder-arch": { packed: cinderValleyArchMesh, color: cinderValleyArchColor },
    "alpine-shrub": { packed: alpineShrubMesh, color: alpineShrubColor },
    "alpine-fence": { packed: alpineFenceMesh, color: alpineFenceColor },
    "alpine-fin": { packed: alpineFinMesh, color: alpineFinColor },
    "alpine-larch": { packed: alpineLarchMesh, color: alpineLarchColor },
    "alpine-gondola": { packed: alpineGondolaMesh, color: alpineGondolaColor },
    "alpine-station": { packed: alpineStationMesh, color: alpineStationColor },
    "pacific-thrift": { packed: pacificThriftMesh, color: pacificThriftColor },
    "pacific-sapling": { packed: pacificSaplingMesh, color: pacificSaplingColor },
    "pacific-shelter": { packed: pacificShelterMesh, color: pacificShelterColor },
    "pacific-chalk": { packed: pacificChalkMesh, color: pacificChalkColor },
    "pacific-lighthouse": { packed: pacificLighthouseMesh, color: pacificLighthouseColor },
    "pacific-monterey": { packed: pacificMontereyMesh, color: pacificMontereyColor },
    "aegean-tuft": { packed: aegeanTuftMesh, color: aegeanTuftColor },
    "aegean-bench": { packed: aegeanBenchMesh, color: aegeanBenchColor },
    "aegean-pillar": { packed: aegeanPillarMesh, color: aegeanPillarColor },
    "aegean-entablature": { packed: aegeanEntablatureMesh, color: aegeanEntablatureColor },
    "aegean-olive": { packed: aegeanOliveMesh, color: aegeanOliveColor },
    "aegean-shrine": { packed: aegeanShrineMesh, color: aegeanShrineColor },
    "blackwood-mill": { packed: blackwoodMillMesh, color: blackwoodMillColor },
    "blackwood-shelter": { packed: blackwoodShelterMesh, color: blackwoodShelterColor },
    "blackwood-fern": { packed: blackwoodFernMesh, color: blackwoodFernColor },
    "blackwood-pier": { packed: blackwoodPierMesh, color: blackwoodPierColor },
    "blackwood-lodge": { packed: blackwoodLodgeMesh, color: blackwoodLodgeColor },
    "blackwood-cedar": { packed: blackwoodCedarMesh, color: blackwoodCedarColor },
    "blackwood-slate": { packed: blackwoodSlateMesh, color: blackwoodSlateColor },
    "skywheel-marquee": { packed: skywheelMarqueeMesh, color: skywheelMarqueeColor },
    "coral-fan": { packed: coralFanMesh, color: coralFanColor },
    "cloudfold-rock": { packed: cloudfoldRockMesh, color: cloudfoldRockColor },
    "frosthaven-ice": { packed: frosthavenIceMesh, color: frosthavenIceColor },
    "aurora-garden": { packed: auroraGardenMesh, color: auroraGardenColor },
    "glasswater-planter": { packed: glasswaterPlanterMesh, color: glasswaterPlanterColor },
    "bellgate-fountain": { packed: bellgateFountainMesh, color: bellgateFountainColor },
    "alpine-scree": { packed: alpineScreeMesh, color: alpineScreeColor },
    "pacific-cypress": { packed: pacificCypressMesh, color: pacificCypressColor },
    "aegean-ruin": { packed: aegeanRuinMesh, color: aegeanRuinColor },
    "ares-breccia": { packed: aresBrecciaMesh, color: aresBrecciaColor },
    "caldera-spatter": { packed: calderaSpatterMesh, color: calderaSpatterColor },
    "cinder-hoodoo": { packed: cinderHoodooMesh, color: cinderHoodooColor },
    "copper-mesa": { packed: copperMesaMesh, color: copperMesaColor },
    "windbreak-oak": { packed: windbreakOakMesh, color: windbreakOakColor },
} satisfies Record<ModelKind, BiomeAsset>;

const geometry = new Map<ModelKind, ReturnType<typeof unpackMeshes>[number]>();

export function drawBiomeModels(scene: Scene, course: Course): Mesh[] {
    const groups = new Map<BiomeLandmarkKind, Stamp[]>();
    const shadowCasters: Mesh[] = [];
    for (const { kind, x, y, z, height, yaw, pitch } of course.biomeLandmarks) {
        const placement = { x, y, z, sx: height, sy: height, sz: height, yaw, ...(pitch !== undefined && { pitch }) };
        const group = groups.get(kind);
        if (group) group.push(placement);
        else groups.set(kind, [placement]);
    }
    for (const [kind, placements] of groups) {
        const mesh = makeModel(scene, kind);
        stamp(mesh, placements);
        mesh.receiveShadows = true;
        if (kind === "caldera-station" || kind === "caldera-lamp" || kind === "caldera-fins" ||
            kind === "skywheel-booth" || kind === "skywheel-gondola" || kind === "skywheel-lamp" || kind === "skywheel-cart" ||
            kind === "ares-dish" || kind === "ares-rover" || kind === "ares-pod" || kind === "ares-tank" ||
            kind === "ares-slate" || kind === "ares-radiator" ||
            kind === "aurora-solar-tree" || kind === "aurora-conservatory" || kind === "aurora-service-pod" ||
            kind === "aurora-ginkgo" || kind === "aurora-orbit" ||
            kind === "glasswater-ferry" || kind === "glasswater-crane" || kind === "glasswater-shelter" ||
            kind === "glasswater-cafe" || kind === "glasswater-sail" || kind === "bellgate-belfry" || kind === "bellgate-stall" || kind === "bellgate-fruit-cart" || kind === "bellgate-citrus" ||
            kind === "bellgate-townhouse" || kind === "frosthaven-boathouse" || kind === "frosthaven-beacon" || kind === "frosthaven-derrick" ||
            kind === "coral-palm" || kind === "coral-lookout" || kind === "coral-marker" || kind === "cloudfold-pavilion" || kind === "cloudfold-cypress" || kind === "cloudfold-armillary") {
            shadowCasters.push(mesh);
        }
    }
    return shadowCasters;
}

export function drawDisplayLandmarks(scene: Scene, kind: DisplayOnlyLandmark, placements: readonly Stamp[]): void {
    stamp(makeModel(scene, kind), placements);
}

export function drawAnimatedLandmark(scene: Scene, kind: AnimatedLandmark): Mesh {
    return makeModel(scene, kind);
}

function makeModel(scene: Scene, kind: ModelKind): Mesh {
    const { packed, color, emissive }: BiomeAsset = assets[kind];
    const shape = geometry.get(kind) ?? unpackMeshes(packed)[0]!;
    geometry.set(kind, shape);
    const mesh = fromPacked(scene, "biome:" + kind, shape);
    const finish = material(scene, kind, "#f6f1eb");
    finish.diffuseTexture = new Texture(color, scene);
    finish.diffuseTexture.name = kind;
    finish.diffuseTexture.anisotropicFilteringLevel = 8;
    finish.specularColor.set(0.046, 0.043, 0.04);
    if (emissive !== undefined) {
        finish.emissiveTexture = new Texture(emissive, scene);
        finish.emissiveTexture.name = kind + " lighting";
        finish.emissiveTexture.level = kind === "caldera-lamp" ? 0.52 : 0.64;
    }
    if (kind === "caldera-lamp") {
        finish.specularColor.set(0.19, 0.119, 0.071);
        finish.specularPower = 43;
    }
    if (kind === "skywheel-booth") {
        finish.specularColor.set(0.20, 0.17, 0.12);
        finish.specularPower = 48;
    }
    if (kind === "skywheel-gondola") {
        finish.specularColor.set(0.20, 0.23, 0.21);
        finish.specularPower = 48;
    }
    if (kind === "skywheel-lamp") {
        finish.specularColor.set(0.31, 0.21, 0.12);
        finish.specularPower = 53;
    }
    if (kind === "skywheel-cart") {
        finish.specularColor.set(0.15, 0.12, 0.096);
        finish.specularPower = 37;
    }
    if (kind === "glasswater-ferry" || kind === "glasswater-shelter") {
        finish.specularColor.set(0.17, 0.22, 0.24);
        finish.specularPower = 54;
    }
    if (kind === "ares-dish") {
        finish.specularColor.set(0.31, 0.21, 0.155);
        finish.specularPower = 50;
    }
    if (kind === "ares-rover") {
        finish.specularColor.set(0.13, 0.14, 0.15);
        finish.specularPower = 43;
    }
    if (kind === "ares-pod") {
        finish.specularColor.set(0.24, 0.19, 0.15);
        finish.specularPower = 47;
    }
    if (kind === "ares-tank") {
        finish.specularColor.set(0.29, 0.32, 0.35);
        finish.specularPower = 62;
    }
    if (kind === "ares-radiator") {
        finish.specularColor.set(0.18, 0.16, 0.15);
        finish.specularPower = 37;
    }
    if (kind === "aurora-orbit") {
        finish.specularColor.set(0.36, 0.25, 0.16);
        finish.specularPower = 47;
    }
    if (kind === "aurora-ginkgo") finish.diffuseColor.set(1.08, 0.89, 0.74);
    if (kind === "aurora-conservatory") {
        finish.specularColor.set(0.20, 0.27, 0.30);
        finish.specularPower = 80;
    }
    if (kind === "aurora-solar-tree") {
        finish.specularColor.set(0.22, 0.20, 0.17);
        finish.specularPower = 53;
    }
    if (kind === "glasswater-sail") {
        finish.specularColor.set(0.28, 0.20, 0.11);
        finish.specularPower = 42;
    }
    if (kind === "bellgate-citrus") {
        finish.specularColor.set(0.16, 0.20, 0.16);
        finish.specularPower = 68;
    }
    if (kind === "bellgate-fountain") {
        finish.diffuseColor.set(1, 0.88, 0.77);
        finish.emissiveColor.set(0.055, 0.032, 0.012);
    }
    if (kind === "coral-fan") finish.emissiveColor.set(0.12, 0.07, 0.03);
    if (kind === "coral-sponges") {
        finish.linkEmissiveWithDiffuse = true;
        finish.emissiveColor.set(0.12, 0.072, 0.053);
    }
    if (kind === "pacific-monterey") {
        finish.diffuseColor.scaleInPlace(0.91);
        finish.specularColor.set(0.026, 0.033, 0.021);
    }
    if (kind === "cloudfold-lamp") {
        finish.linkEmissiveWithDiffuse = true;
        finish.emissiveColor.set(0.29, 0.13, 0.045);
    }
    if (kind === "cloudfold-cypress") finish.diffuseColor.set(0.98, 0.87, 0.78);
    if (kind === "cloudfold-armillary") {
        finish.specularColor.set(0.24, 0.15, 0.075);
        finish.specularPower = 61;
    }
    if (kind === "cloudfold-crag") finish.emissiveColor.set(0.04, 0.034, 0.025);
    if (kind === "caldera-spatter") finish.emissiveColor.set(0.045, 0.031, 0.043);
    mesh.material = finish;
    return mesh;
}
