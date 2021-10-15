
// import { create, Client, SimpleListener  }
import { create, Client } from '../src/index';

const { default: PQueue } = require("p-queue");
const queue = new PQueue({ concurrency: 2, timeout: 1000 });

create()
  .then(async (client: Client) => {
    const { me } = await client.getMe()

    for (let i = 0; i < 25; i++) {
      await queue.add(() => client.sendText(me._serialized, '' + i))
    }
  })
  .catch(e => console.log('Error', e.message));