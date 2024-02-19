import JSZip from 'jszip';

export async function readZip(file: File) {
  const zip = new JSZip();

  const zipFile = await zip.loadAsync(file, {createFolders: true});

  const folderNames = Object.keys(zipFile.files).filter((filename) =>
    zipFile.files[filename].dir
  );

  if (folderNames.length !== 1) {
    console.error('Unknown zip file');
    return;
  }

  if (folderNames[0] === 'Spotify Account Data/') {
    console.error('Use Extended Streaming History');
    return;
  }

  if (folderNames[0] !== 'Spotify Extended Streaming History/') {
    console.error('Unknown zip file');
    return;
  }

  await Promise.all(
    Object.keys(zipFile.files).map(async (filename) => {
      const fileData = await zipFile.files[filename].async('string');
      if (filename.endsWith('.json')) {
        console.log(fileData);
      }
    })
  );
}