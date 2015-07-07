import VersionControl from './lib/VersionControl';
import BinDelta from './lib/utils/BinDelta';
import Digest from './lib/utils/Digest';

import MemoryVersionStore from './lib/store/MemoryVersionStore';
import SqliteVersionStore from './lib/store/SqliteVersionStore';

export default {
    VersionControl,
    store : {
        MemoryVersionStore,
        SqliteVersionStore,
    },
    utils : {
        BinDelta,
        Digest
    }
}