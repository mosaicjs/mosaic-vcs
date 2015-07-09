import Blob from './lib/Blob';
import Revision from './lib/Revision';
import BinDelta from './lib/utils/BinDelta';
import Digest from './lib/utils/Digest';

import MemoryVersionStore from './lib/store/MemoryVersionStore';
import SqliteVersionStore from './lib/store/SqliteVersionStore';

export default {
    Blob,
    Revision,
    store : {
        MemoryVersionStore,
        SqliteVersionStore,
    },
    utils : {
        BinDelta,
        Digest
    }
}