import Blob from './lib/Blob';
import BinDelta from './lib/utils/BinDelta';
import Digest from './lib/utils/Digest';

import MemoryVersionStore from './lib/store/MemoryVersionStore';
import SqliteVersionStore from './lib/store/SqliteVersionStore';

export default {
    Blob,
    store : {
        MemoryVersionStore,
        SqliteVersionStore,
    },
    utils : {
        BinDelta,
        Digest
    }
}