// Pre-import resource images so Vite bundles them and paths are stable
import telleriumImg from '../../assets/images/resources/tellerium.png'
import kryptonImg from '../../assets/images/resources/krypton.png'
import mineImg from '../../assets/images/resources/mine.png'
import probeImg from '../../assets/images/resources/probe.png'

const imageByResource: Record<string, string> = {
  tellerium: telleriumImg,
  krypton: kryptonImg,
  T: telleriumImg,
  K: kryptonImg,
  mine: mineImg,
  probe: probeImg,
}

export function getResourceImage(resource: 'tellerium' | 'krypton' | 'T' | 'K' | 'mine' | 'probe'): string | undefined {
  return imageByResource[resource]
}

export function getTelleriumImage(): string {
  return telleriumImg
}

export function getKryptonImage(): string {
  return kryptonImg
}

export function getMineImage(): string {
  return mineImg
}

export function getProbeImage(): string {
  return probeImg
}

