// Pre-import ship images so Vite bundles them and paths are stable
import assaultCarrierImg from '../../assets/images/ships/assault_carrier.png'
import assaultFighterImg from '../../assets/images/ships/assault_fighter.png'
import battleCruiserImg from '../../assets/images/ships/battle_cruiser.png'
import battleFrigateImg from '../../assets/images/ships/battle_frigate.png'
import battleMothershipImg from '../../assets/images/ships/battle_mothership.png'
import commandMothershipImg from '../../assets/images/ships/command_mothership.png'
import escortFrigateImg from '../../assets/images/ships/escort_frigate.png'
import fleetCarrierImg from '../../assets/images/ships/fleet_carrier.png'
import heavyCruiserImg from '../../assets/images/ships/heavy_cruiser.png'
import invasionShipImg from '../../assets/images/ships/invasion_ship.png'
import orbitalFortressImg from '../../assets/images/ships/orbital_fortress.png'
import patrolCorvetteImg from '../../assets/images/ships/patrol_corvette.png'
import scoutFighterImg from '../../assets/images/ships/scout_fighter.png'
import strikeCorvetteImg from '../../assets/images/ships/strike_corvette.png'

const imageBySlug: Record<string, string> = {
  assault_carrier: assaultCarrierImg,
  assault_fighter: assaultFighterImg,
  battle_cruiser: battleCruiserImg,
  battle_frigate: battleFrigateImg,
  battle_mothership: battleMothershipImg,
  command_mothership: commandMothershipImg,
  escort_frigate: escortFrigateImg,
  fleet_carrier: fleetCarrierImg,
  heavy_cruiser: heavyCruiserImg,
  invasion_ship: invasionShipImg,
  orbital_fortress: orbitalFortressImg,
  patrol_corvette: patrolCorvetteImg,
  scout_fighter: scoutFighterImg,
  strike_corvette: strikeCorvetteImg,
}

export function getShipImage(slug?: string): string | undefined {
  if (!slug) return undefined
  return imageBySlug[slug]
}

