// Props for the private "my profile" panel shared by the manage link and the dashboard.
import { ageFromDob, formatDate, profileCode } from './format.js';
import { biodata, biodataToText } from './profile-schema.js';
import { profilePhotos } from './profiles.js';
import { getT } from './i18n/server.js';
import { getSetting } from './settings.js';

const subtitle = (profile) => [`${ageFromDob(profile.date_of_birth)} years`, profile.city, profile.country_name, profile.marital_status].filter(Boolean).join(' · ');

export async function manageProps(profile, token) {
  const code = profileCode(profile.id);
  const [photo] = await profilePhotos(profile.id);
  const data = biodata(profile, code, { publicOnly: false });
  return {
    text: biodataToText(data, await getT()),
    code,
    sheet: {
      data,
      subtitle: subtitle(profile),
      photo: photo ? `/media/photos/${photo.file}${token ? `?m=${token}` : ''}` : null,
      phone: await getSetting('site_phone'),
      generatedOn: formatDate(new Date()),
    },
  };
}

// The same document holding only what this viewer may receive.
export async function publicExportProps(profile, photoFile, options = {}, contact = []) {
  const code = profileCode(profile.id);
  const data = { ...biodata(profile, code, options), contact };
  return {
    text: biodataToText(data, await getT()),
    code,
    sheet: { data, subtitle: subtitle(profile), photo: photoFile ? `/media/photos/${photoFile}` : null, phone: await getSetting('site_phone'), generatedOn: formatDate(new Date()) },
  };
}
