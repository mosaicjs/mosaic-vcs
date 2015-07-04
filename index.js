import VersionControl from './lib/VersionControl';
import MemoryVersionStore from './lib/MemoryVersionStore';
import BinDelta from './lib/BinDelta';
import Digest from './lib/Digest';
import SqliteVersionStore from './lib/SqliteVersionStore';
export default {
    VersionControl,
    MemoryVersionStore,
    SqliteVersionStore,
    BinDelta,
    Digest
}