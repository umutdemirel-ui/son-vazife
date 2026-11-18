import * as THREE from 'three';
import type { ResidentVisual } from './residentVisual';
import { exteriorFloorAt } from './terrain';
import {
  AutopsyCaseId,
  AutopsyCaseState,
  ClueDocument,
  DialogueOption,
  InventoryItem,
  NpcId,
} from './types';

export interface NpcDialogueNode {
  id: string;
  text: string;
  options: DialogueOption[];
}

export interface NpcDefinition {
  id: NpcId;
  name: string;
  role: string;
  pace: number;
  waypoints: Array<{ x: number; z: number; pauseSec: number }>;
  nodes: Record<string, NpcDialogueNode>;
}

export const VILLAGE_NPCS: Record<NpcId, NpcDefinition> = {
  bekci: {
    id: 'bekci',
    name: 'Bekçi Hasan',
    role: 'Gece Bekçisi · Kuzdağ Karakol Emeklisi',
    pace: 1.05,
    waypoints: [
      { x: -1.8, z: 14.0, pauseSec: 4.5 },
      { x: 1.5, z: -3.5, pauseSec: 4.0 },
      { x: 6.2, z: -18.5, pauseSec: 4.5 },
      { x: 1.8, z: 3.5, pauseSec: 3.5 },
    ],
    nodes: {
      root: {
        id: 'root',
        text: 'Hoş geldin evlat. Hava tipiye dönmeden Hacı Arif Amca’nın yanına geçmen iyi oldu. Ama dikkat et — bu gece rüzgâr bile başka esiyor.',
        options: [
          {
            id: 'ask_village',
            label: 'Köy neden bu kadar boş? Diğerleri nerede?',
            nextNodeId: 'village_empty',
            trustDelta: 4,
            unlockGlossaryIds: ['lore_bekci_shadows'],
          },
          {
            id: 'ask_first_register',
            label: 'Bu fişe bak. Arif Efendi’yi yirmi yıl önce de mi uğurladınız?',
            nextNodeId: 'old_register',
            requiredClueId: 'clue_first_ledger',
          },
          {
            id: 'ask_arif_autopsy',
            label:
              '[Adli Kanıt] Hacı Arif kalp krizinden ölmemiş — ciğerlerinde dere suyu ve zehir var.',
            nextNodeId: 'arif_reaction',
            requiredCompletedCase: 'case_arif',
            unlockItemId: 'clinic_key',
            trustDelta: 12,
            advanceActTo: 2,
          },
          {
            id: 'ask_mahmut_autopsy',
            label: '[Otopsi Raporu] Şoför Mahmut kazadan 85 dakika önce zehirlenmiş!',
            nextNodeId: 'mahmut_reaction',
            requiredCompletedCase: 'case_mahmut',
            trustDelta: 10,
            advanceActTo: 3,
            unlockGlossaryIds: ['lore_bekci_breath'],
          },
          {
            id: 'leave',
            label: 'Şimdi gitmem gerek, gözün kulağın açık olsun.',
            nextNodeId: null,
          },
        ],
      },
      old_register: {
        id: 'old_register',
        text: 'Tarihe değil, şu mühre bak. Benim mührüm; ama o satır benim yazım değil. Gece gelen cenazelerle ilgili soru sorma, evlat. Arif’in defterini sundurmada bıraktım.',
        options: [
          { id: 'register_return', label: 'Fişi cebine koy. Başka bir şey sor.', nextNodeId: 'root' },
          { id: 'register_depart', label: 'Sundurmadaki defteri almaya git.', nextNodeId: null },
        ],
      },
      village_empty: {
        id: 'village_empty',
        text: 'Üç gün önce çeşme geceleri kesilmeye başladı. Önce Şoför Mahmut’un minibüsü yukarı virajda uçtu dediler, ertesi sabah köydeki son üç hane kamyonete doluşup indi. Kalan bir tek Şerife Nine, Katip Kenan, Mezarcı İdris, bir de ben varım.',
        options: [
          {
            id: 'ask_crash',
            label: 'Minibüs virajdan nasıl düştü? Yolcu var mıydı?',
            nextNodeId: 'crash_detail',
          },
          {
            id: 'back_root',
            label: 'Diğer konulara dön',
            nextNodeId: 'root',
          },
        ],
      },
      crash_detail: {
        id: 'crash_detail',
        text: '22:40 sularında tipi göz gözü görmüyordu. Katip Kenan “tek şoför vardı” diye tutanak yazdı ama ben o gece iki gölge gördüm. Merak ediyorsan Sağlık Ocağındaki ikinci masaya bakman gerek.',
        options: [
          {
            id: 'back_root',
            label: 'Anladım, dikkat edeceğim.',
            nextNodeId: 'root',
          },
        ],
      },
      arif_reaction: {
        id: 'arif_reaction',
        text: 'Ne diyorsun sen?! Arif Hoca akşamüstü değirmene doğru yürümüştü... Kenan “kalp” deyip gasilhaneye kapattırdı. Al bu pirinç anahtarı: Yukarı Mahalle’deki Sağlık Ocağında Şoför Mahmut’un bedeni de duruyor. Onu da incele!',
        options: [
          {
            id: 'go_clinic',
            label: 'Sağlık Ocağı Anahtarını al ve oraya doğru yola çık.',
            nextNodeId: null,
          },
        ],
      },
      mahmut_reaction: {
        id: 'mahmut_reaction',
        text: 'Demek Kenan herkesi kandırdı! Eğer zehir Boğanak otuysa bu ot sadece batıdaki Dere Köprüsünün ötesinde, Eski Su Değirmeni kıyısında yetişir. Dereyi geçerken Kara Basma’ya yakalanma — ışığını söndürüp eğil!',
        options: [
          {
            id: 'close_bekci',
            label: 'Değirmene ve viraja bakacağım. Sağ ol Bekçi Amca.',
            nextNodeId: null,
          },
        ],
      },
    },
  },
  serife: {
    id: 'serife',
    name: 'Şerife Nine',
    role: 'Köyün Son Yaşlısı · Eski Köy Evi Avlusu',
    pace: 0.58,
    waypoints: [
      { x: -6.4, z: -10.5, pauseSec: 9.0 },
      { x: -5.8, z: -9.4, pauseSec: 6.5 },
    ],
    nodes: {
      root: {
        id: 'root',
        text: 'Evladım... yüzün neden o kadar solgun? Üşümüşsün, ellerin buz gibi. Geceleri bu sokakta tek başına dolaşma, pencereye tıklayan olursa sakın bakma.',
        options: [
          {
            id: 'ask_folklore',
            label: 'Hacı Arif’in defterindeki kurallar gerçekten doğru mu?',
            nextNodeId: 'folklore_advice',
            trustDelta: 5,
            unlockGlossaryIds: ['lore_serife_window', 'lore_serife_water'],
          },
          {
            id: 'ask_boganak',
            label: '[Mühürlü Dosya] Raporda Boğanak’tan söz ediliyor. Burada o otu kim tanır?',
            nextNodeId: 'boganak_story',
            requiredCompletedCase: 'case_arif',
            trustDelta: 8,
            unlockGlossaryIds: ['lore_serife_boganak'],
          },
          {
            id: 'ask_identity',
            label: '[Mahzen Gerçeği] Taş mahzende duran 22:42 saatli yolcu kim?',
            nextNodeId: 'truth_whisper',
            requiredCompletedCase: 'case_unknown',
            trustDelta: 10,
          },
          {
            id: 'leave',
            label: 'Allah’a emanet ol Nine, işime dönmem lazım.',
            nextNodeId: null,
          },
        ],
      },
      folklore_advice: {
        id: 'folklore_advice',
        text: 'Ölü bekletilmez evlat, Sabır Mumunu yakmadan kapıdan çıkma. Kirli yıkama suyunu gece toprağa dökersen eşiktekiler uyanır. Kara Basma uğultuyla gelirse eğil ve mumunu üfle.',
        options: [
          {
            id: 'back',
            label: 'Aklımda tutacağım.',
            nextNodeId: 'root',
          },
        ],
      },
      boganak_story: {
        id: 'boganak_story',
        text: 'Eski Su Değirmeninin arkasında mor çiçek açar Boğanak... Eskiden deli danayı uyutmak için bir damla kaynatırlardı. İki gece önce Katip Kenan’ı elinde bakır tasla değirmenden çıkarken gördüm.',
        options: [
          {
            id: 'back',
            label: 'Değirmende iz bulabilirim demek.',
            nextNodeId: 'root',
          },
        ],
      },
      truth_whisper: {
        id: 'truth_whisper',
        text: 'Sen... yukarı virajdan yürüyerek geldiğini sanıyorsun, değil mi? Oysa minibüs 22:40’ta uçuruma yuvarlandığında Hacı Arif seni son vazifesini tamamlayamadan çağırmış gibi ruhun köye düştü. Vazifeyi bitir ki şafak söksün.',
        options: [
          {
            id: 'close',
            label: 'Son vazifeyi tamamlayacağım.',
            nextNodeId: null,
          },
        ],
      },
    },
  },
  kenan: {
    id: 'kenan',
    name: 'Katip Kenan',
    role: 'Muhtarlık Katibi & Sağlık Memuru',
    pace: 1.17,
    waypoints: [
      { x: 6.2, z: -16.47, pauseSec: 5.5 },
      { x: 6.0, z: -22.5, pauseSec: 0.3 }, // skirt the muhtarlık, rather than walking through it
      { x: 16.5, z: -23.5, pauseSec: 5.0 },
      { x: 21.0, z: -26.5, pauseSec: 5.5 },
      { x: 6.0, z: -22.5, pauseSec: 0.3 },
    ],
    nodes: {
      root: {
        id: 'root',
        text: 'Gassal yardımcısı! İşini sessizce yap, sabah jandarma yolu açınca raporları alıp gideceğiz. Eski kayıtlara burnunu sokmana hiç gerek yok.',
        options: [
          {
            id: 'ask_report',
            label: '22:40 viraj kazasında neden tutanaklar eksik görünüyor?',
            nextNodeId: 'defensive_reply',
            dreadDelta: 4,
          },
          {
            id: 'confront_mahmut',
            label:
              '[Rapor ve Değirmen Kaydı] Mahmut kazadan 85 dakika önce zehirlendi! El yazın değirmen defterinde!',
            nextNodeId: 'kenan_breakdown',
            unlockClueId: 'clue_kenan_confession',
            requiredClueId: 'clue_mill_ledger',
            requiredCompletedCase: 'case_mahmut',
            trustDelta: -10,
            dreadDelta: 12,
            advanceActTo: 4,
          },
          {
            id: 'leave',
            label: 'Şimdilik bu kadar yeter.',
            nextNodeId: null,
          },
        ],
      },
      defensive_reply: {
        id: 'defensive_reply',
        text: 'Tipide evrak mı tutulurmuş?! Şoför Mahmut direksiyonu kırdı, o kadar. Gasilhanede işin bittiyse kapıyı kapa ve sabahı bekle.',
        options: [
          {
            id: 'back',
            label: 'Göreceğiz bakalım.',
            nextNodeId: 'root',
          },
        ],
      },
      kenan_breakdown: {
        id: 'kenan_breakdown',
        text: 'Sus... sus artık! Mahmut şehre gidip köyün su şebekesindeki kaçak hafriyatı ve kaybolan paraları ihbar edecekti! Hacı Arif de çeşmede konuşurken duydu. İkisini susturmak zorundaydım... ama 22:40’ta minibüse binen sen — senin ölmeni istememiştim! Mezarlık Tepesindeki İdris’e git, üçüncü bedeni oraya sakladık!',
        options: [
          {
            id: 'close_kenan',
            label: 'Mezarlık Tepesine çıkıp gerçeği göreceğim!',
            nextNodeId: null,
          },
        ],
      },
    },
  },
  idris: {
    id: 'idris',
    name: 'Mezarcı İdris',
    role: 'Mezarlık Tepesi Bekçisi',
    pace: 0.92,
    waypoints: [
      { x: -27.5, z: -31.5, pauseSec: 6.0 },
      { x: -31.0, z: -35.5, pauseSec: 6.5 },
    ],
    nodes: {
      root: {
        id: 'root',
        text: 'Toprak bu gece çok sert... Kazma bile girmiyor. Buraya neden çıktın yabancı? Mezarlık gece yaşayanlara göre değil.',
        options: [
          {
            id: 'ask_grave',
            label: 'Yeni kazılmış mezar kimin için hazırlandı?',
            nextNodeId: 'grave_talk',
            unlockGlossaryIds: ['lore_idris_soil'],
          },
          {
            id: 'demand_crypt',
            label:
              '[Kenan İtirafı] Katip Kenan üçüncü bedeni Taş Mahzene koyduğunuzu söyledi. Anahtarı ver!',
            nextNodeId: 'give_crypt_key',
            requiredClueId: 'clue_kenan_confession',
            requiredCompletedCase: 'case_mahmut',
            unlockItemId: 'crypt_key',
            trustDelta: 6,
          },
          {
            id: 'leave',
            label: 'Geri dönüyorum.',
            nextNodeId: null,
          },
        ],
      },
      grave_talk: {
        id: 'grave_talk',
        text: 'Sabaha karşı iki tabut gömülecek sandım ama Kenan üçüncü bir çukur daha kazdırdı. “Kimliği belirsiz yolcu” dedi, soğuk taş mahzene kilitledi.',
        options: [
          {
            id: 'back',
            label: 'Mahzeni açmam gerekecek.',
            nextNodeId: 'root',
          },
        ],
      },
      give_crypt_key: {
        id: 'give_crypt_key',
        text: 'Demek Kenan çözüldü... Al mahzenin demir anahtarını. İçerideki masada yatan yolcunun cebine bakınca kendi gözlerine inanamayacaksın. Allah taksiratını affetsin.',
        options: [
          {
            id: 'close_idris',
            label: 'Taş Mahzen Anahtarını al ve içeri gir.',
            nextNodeId: null,
          },
        ],
      },
    },
  },
};

export interface NpcRuntimeActor {
  def: NpcDefinition;
  root: THREE.Group;
  visual: Pick<ResidentVisual, 'eyeHeight' | 'update'>;
  waypointIndex: number;
  pauseTimer: number;
  pos: THREE.Vector3;
  yaw: number;
  spokenNodes: Set<string>;
  trust: number;
}

export function filterDialogueOptions(
  options: DialogueOption[],
  clues: ClueDocument[],
  autopsyCases: Record<AutopsyCaseId, AutopsyCaseState>,
  inventory: InventoryItem[],
): DialogueOption[] {
  return options.filter((opt) => {
    if (opt.requiredClueId) {
      const c = clues.find((cl) => cl.id === opt.requiredClueId);
      if (!c || !c.discovered) return false;
    }
    if (opt.requiredCompletedCase) {
      const ac = autopsyCases[opt.requiredCompletedCase];
      if (!ac || !ac.completed) return false;
    }
    if (opt.unlockItemId) {
      const inv = inventory.find((i) => i.id === opt.unlockItemId);
      if (inv?.collected) return false;
    }
    return true;
  });
}

export function updateNpcActorPatrol(
  actor: NpcRuntimeActor,
  dt: number,
  playerPos: THREE.Vector3,
  isTalkingToThisNpc: boolean,
  elapsedTime: number,
): void {
  const distToPlayer = actor.pos.distanceTo(playerPos);

  if (isTalkingToThisNpc || distToPlayer < 2.9) {
    // Face player politely and idle
    const targetYaw = Math.atan2(playerPos.x - actor.pos.x, playerPos.z - actor.pos.z);
    let diff = targetYaw - actor.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    actor.yaw += diff * Math.min(1, dt * 6);
    actor.root.rotation.y = actor.yaw;
    actor.visual.update(dt, false, distToPlayer, elapsedTime);
    return;
  }

  if (actor.pauseTimer > 0) {
    actor.pauseTimer -= dt;
    actor.visual.update(dt, false, distToPlayer, elapsedTime);
    return;
  }

  const wp = actor.def.waypoints[actor.waypointIndex];
  const dx = wp.x - actor.pos.x;
  const dz = wp.z - actor.pos.z;
  const dist = Math.hypot(dx, dz);

  if (dist < 0.35) {
    actor.pauseTimer = wp.pauseSec;
    actor.waypointIndex = (actor.waypointIndex + 1) % actor.def.waypoints.length;
    actor.visual.update(dt, false, distToPlayer, elapsedTime);
    return;
  }

  const speed = actor.def.pace;
  actor.pos.x += (dx / dist) * speed * dt;
  actor.pos.z += (dz / dist) * speed * dt;
  actor.pos.y = exteriorFloorAt(actor.pos.x, actor.pos.z);
  actor.root.position.copy(actor.pos);

  const targetYaw = Math.atan2(dx, dz);
  let diff = targetYaw - actor.yaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  actor.yaw += diff * Math.min(1, dt * 5);
  actor.root.rotation.y = actor.yaw;

  actor.visual.update(dt, true, distToPlayer, elapsedTime);
}
