$1E screen page
.( Loading WITCH )
80 load

$8379 constant vdptimer

create player-sprite* 2 cells allot
: player-sprite ( n -- addr ) cells player-sprite* + ;

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

: joypat ( player# -- )
    dup joyst $1E and
    case
        8 of 0 endof                    \ down
        10 of 1 endof                   \ down left
        2 of 2 endof                    \ left
        18 of 3 endof                   \ up left
        16 of 4 endof                   \ up
        20 of 5 endof                   \ up right
        4 of 6 endof                    \ right
        12 of 7 endof                   \ down right
        0
    endcase
    3 <<
    swap player-sprite ! ;

: joyvec ( player# -- dy dx )
    joyst dup
    24 and case                         \ y
        16 of -1 endof
        8 of 1 endof
        0 endcase
    swap 6 and case                     \ x
        2 of -1 endof
        4 of 1 endof
        0 endcase ;

: joydir ( player# -- )
    dup >r
    r@ joypat
    r@ joyvec
    2dup r> sprloc? movement-ok? not if
        2drop 0 0
    then
    sprvec ;

: joydir* ( player# -- )
    dup joyvec sprvec ;

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

\ Gates

$A6 value gate-char
22 value wall-height
variable gates 3 cells allot
variable gate-width 5 gate-width !
variable gate-speed 10 gate-speed !

: gate@ ( n -- v ) cells gates + @ ;
: gate! ( v n -- ) cells gates + ! ;
: gate-x ( n -- ) 8 * 3 + ;
: place-gate ( n -- )
    >r
    wall-height rnd r@ gate!
    0 r@ gate-x gate-char wall-height vchar
    r@ dup gate@ dup gate-width @ + swap do
        dup gate-x i wall-height mod gotoxy space
    loop
    drop r> drop ;

: place-gates ( -- )
    4 0 do i place-gate loop ;

: gate-cycle ( -- n )
    vdptimer c@ gate-speed @ mod ;

: gate-xy ( n -- x y )
    dup gate-x
    swap gate@ ;

: gate-end-y ( n -- y' )
    gate@ gate-width @ + wall-height mod ;

: update-gate ( n -- )
    >r
    r@ 1 and if
        1 bl gate-char
    else
        -1 gate-char bl
    then                                \ s:inc botchar topchar
    r@ gate-xy gotoxy emit              \ s:inc botchar
    r@ gate-x r@ gate-end-y gotoxy emit \ s:inc
    r@ gate@ +                          \ s:y
    wall-height mod r@ gate!
    r> drop ;

: update-gates ( -- )
    4 0 do i update-gate loop ;

\ Sprites

: sprite-cycle ( -- n )
    vdptimer c@ 3 >> 1 and 2 << ;

: p-set-sprite ( n player -- )
    dup player-sprite @                 \ n player base
    rot +                               \ player sprite
    sprpat ;

: process-sprites ( -- )
    0 joydir 1 joydir
    sprite-cycle
    dup
    0 p-set-sprite
    1 p-set-sprite
    0 2 sprmov ;

: init-players ( -- )
    0 0 player-sprite !
    0 1 player-sprite !
    0 80   0 0 player-sprite @ 1 sprite
    1 80 240 1 player-sprite @ 8 sprite ;

\ Status Display

: display-status ( -- )
    23 0 bl 32 hchar
    2 0 do
        i 8 * 23 gotoxy
        gate-char $f i undersprite if
            ." gate! "
        then
    loop
    16 23 gotoxy
    16 0 1 coinc if
        ." Touch! "
    then ;

: init-graphics ( -- )
    97 load-chars
    1 gmode
    2 magnify
    14 screen
    16 0 do i 1 14 color loop
    page ;

\ Main Game Loop
: witch ( -- )
    init-graphics
    init-players
    place-gates
    begin
        process-sprites
        display-status
        gate-cycle 0= if update-gates then
        key? case
            bl of leave endof
            ascii + of 1 gate-speed +! endof
            ascii - of -1 gate-speed +! endof
        endcase
    again ;

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
    0 0 gotoxy 149 emit ;

: frame-color ( n -- )
    20 16 do i over 4 color loop drop ;

: show-petsci ( -- )
    1 gmode
    page
    hex
    ."    0123456789ABCD " cr
    $100 $80 do
        i $0f and 0= if
            i $f0 and .
        then
        i emit
        i $0f and $0f = if
            cr
        then
    loop
    decimal ;

.( Type WITCH to run the game )

