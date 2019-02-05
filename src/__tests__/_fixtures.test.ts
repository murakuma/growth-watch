
import { genBinaryDirTree } from "./fixtures/genDirTree";

describe( "fixtures", () => {

    it( "should generate binary dir tree", () => {
        expect( genBinaryDirTree( 1 ) ).toEqual(
            ["0", "1"]
        );
        expect( genBinaryDirTree( 2 ) ).toEqual(
            ["0/00", "0/01", "1/10", "1/11"]
        );
        expect( genBinaryDirTree( 3 ) ).toEqual(
            ["0/00/000", "0/00/001", "0/01/010", "0/01/011", "1/10/100", "1/10/101", "1/11/110", "1/11/111"]
        );
        expect( genBinaryDirTree( 4 ) ).toHaveLength( 16 );
    } );

} );
