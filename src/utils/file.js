import fs from 'fs/promises';

const deleteTempFile = async (filePath) => {
  await fs.unlink(filePath);
  console.log(`Deleted temp file: ${filePath}`);
};

export default deleteTempFile;