PAGE
.( Loading WITCH )
80 load

: axis-ok? ( delta value max -- flag )
    >r
    2dup r> = swap 1 = and              \ delta value flag
    if
        2drop false
    else
        0= swap -1 = and not
    then ;

: movement-ok? ( dy dx y x -- flag )
    rot swap                            \ dy y dx x
    240 axis-ok? if
        160 axis-ok?
    else
        2drop false
    then ;

: joyvec ( sprite# -- dy dx )
    joyst dup
    24 and case
        16 of -1 endof
        8 of 1 endof
        0 endcase
    swap 6 and case
        2 of -1 endof
        4 of 1 endof
        0 endcase ;

: joydir ( sprite# -- )
    dup >r
    r@ joyvec
    2dup r> sprloc? movement-ok? not if
        2drop 0 0
    then
    sprvec ;

\ Load character set and sprites from binary blocks
variable char-buffer 6 allot
: get-char ( address -- )
    char-buffer 8 vmbr ;
: load-chars ( block# -- )
    dup block
    512 0 do
        dup i 127 and 8 * + get-char
        char-buffer 4 i dchar
        i 127 and 127 = if
            drop 1+ dup block
        then
    loop drop drop ;

$8379 constant vdptimer
: init-graphics ( -- )
    97 load-chars 1 gmode 2 magnify page
    0 70 70 0 1 sprite 1 100 100 0 3 sprite ;
: process-sprites ( -- )
    0 joydir 1 joydir
    0 2 sprmov
    vdptimer c@ 3 >> 3 and 2 <<
    dup 0 swap sprpat 1 swap sprpat ;
: display-status ( -- )
    10 0 gotoxy
    16 0 1 coinc if ." Touch! " else 7 spaces then ;

\ Main Game Loop
: witch ( -- )
    init-graphics
    begin
        process-sprites
        display-status
        key? 32 = if leave then
    again ;

.( Type WITCH to run the game )

\ undersprite demo
: frame ( -- )
    data 8 $ff80 $8080 $8080 $8080 $8080 $8080 $8080 $80ff 256
    dchar
    data 8 $ff01 $0101 $0101 $0101 $0101 $0101 $0101 $01ff 258
    dchar ;
17 17 value sy value sx
: main ( -- ) 1 gmode  frame  2 magnify   256 0 do i emit loop
    0 sy sx 0 9 sprite  8 23 gotoxy ." Looking for * character"
    begin  0 sy sx sprloc  42 15 0 underSprite  0 23 gotoxy $.
    0 joyst case
    16 of -1 +to sy false endof  8 of 1 +to sy false endof
     2 of -1 +to sx false endof  4 of 1 +to sx false endof
     1 of true endof dup of false endof endcase until ;

\ PETSCI experiments
\ 130 | 131 - 137 tr 138 bl 139 br 149 tl
: petsci-frame ( -- )
    1 gmode page
    0 1 131 30 hchar
    31 0 gotoxy 137 emit
    1 31 130 18 vchar
    31 19 gotoxy 139 emit
    19 1 131 30 hchar
    0 19 gotoxy 138 emit
    1 0 130 18 vchar
    0 0 gotoxy 149 emit
;
: frame-color ( n -- )
    20 16 do i over 4 color loop drop ;
