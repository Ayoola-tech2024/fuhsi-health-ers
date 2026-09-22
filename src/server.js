require('dotenv').config();
const app = require('./app');
const { autoBootDb } = require('./db/autoBoot');

const PORT = process.env.PORT || 4000;

async function start() {
  await autoBootDb();

  app.listen(PORT, () => {
    console.log(`FUHSI ERS backend listening on port ${PORT}`);
  });
}

start();
