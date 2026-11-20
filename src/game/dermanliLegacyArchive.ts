import {readAutoSave,type SaveGamePayload} from './saveSystem';

/** Display-only summary. Kuzdağ is a separate story; never use it as Dermanlı progress. */
export function legacyArchiveFromSave(save:SaveGamePayload|null) {
 if(!save)return null;
 const names=[['case_arif','Vaka I · Hacı Arif'],['case_mahmut','Vaka II · Şoför Mahmut'],['case_unknown','Vaka III · İsimsiz yolcu']] as const;
 return {act:save.act,completed:names.filter(([id])=>save.autopsyCases?.[id]?.completed===true).map(([,name])=>name)};
}
export function readLegacyArchive(){return legacyArchiveFromSave(readAutoSave());}

/** Never start a new Kuzdağ session over an existing unreadable save. */
export function legacySaveStatus(): 'available'|'missing'|'invalid'|'inaccessible' {
 try {
  const raw=window.localStorage.getItem('son_vazife_save_v2');
  if(raw===null)return 'missing';
  return readAutoSave()?'available':'invalid';
 } catch {return 'inaccessible';}
}
