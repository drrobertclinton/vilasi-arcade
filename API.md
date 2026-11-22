# Vilasi Arcade: how to write a game

A game is ONE file, `games/<id>.js`, that calls `VG.register({...})`. The engine (`engine.js`, read it, it is short)
gives you a box world, characters, bots, tools, projectiles, a camera, input and a HUD. `games/wreck-island.js` is a
complete working example. Do not edit `engine.js`, `index.html` or another game's file. If the engine truly lacks
something you need, work around it inside your game file and say so in your final report.

## Skeleton

```js
VG.register({
  id:'my-game', name:'My Game', tagline:'One short line for the game tile.', color:0x3d8bff, levels:5,
  howTo:['3 to 5 short plain sentences a 10-year-old can follow.'],
  create(E){                      // E = the engine for this round. Build the map, place players, return hooks.
    const {V,rand,irand,pick,clamp,shuffle}=VG.util, C=VG.COLORS, W=E.world, B=VG.build, L=E.level; // L = 1..levels
    // ... build map, set up E.player and bots ...
    return {
      update(dt){ /* every frame while the round is live */ },
      autopilot(dt){ /* REQUIRED for testing: drive E.player like a bot (see Testing) */ },
      onDeath(c,by){}, onBreak(box,from){}, canDamage(target,by){ /* return false to block */ }, onCatch(shooter,hit){},
      dispose(){}
    };
  }
});
```

## Units and feel

- y is up. A character is 1.1 wide, 2.4 tall; `c.pos` is at the FEET. Walk speed 11 units/s, jump velocity 16.
- With normal gravity (-42) a jump rises about 3.0 and carries about 8 units forward at full speed. Keep required
  jumps to gaps <= 5.5 and rises <= 2.2 so they feel fair. Anyone auto-steps up ledges <= 1.05 high (stairs: 1 high).
- `W.gravity` (default -42) and `W.killY` (default -45; anyone below it is out) can be changed.
- Performance budget: at most ~6000 boxes, 12 characters, and keep per-frame work light (no per-frame loops over all boxes).

## World (E.world = W)

- `W.addBox(x,y,z, sx,sy,sz, color, opts)` -> box. x,y,z is the CENTRE, sizes are full sizes, boxes are axis-aligned.
  opts: `breakable` (explosions remove it), `solid:false` (walk through), `glow:true` (unlit bright color),
  `tag`, `data`, `jitter:0` (exact color). Box fields you may read: x,y,z,sx,sy,sz,minx..maxz,alive,tag,data,breakable.
- `W.removeBox(b)`, `W.breakBox(b,fromPos)` (with debris + onBreak), `W.setColor(b,color)`,
  `W.moveBox(b,x,y,z)` (moving platforms; riders are carried), `W.resizeBox(b,sx,sy,sz)`.
- `W.groundY(x,z,fromY)` -> top of the highest solid box at (x,z) at or below fromY, or -Infinity.
- `W.ray(origin,unitDir,len)` -> null or `{box,t,point,normal}`. `W.blast(pos,radius,max)` breaks breakable boxes.
- `W.boxes` is a Set of all live boxes (fine to scan once at setup, not every frame).
- Builders (bricks are 2 long x 2 high x 1 thick, all breakable by default):
  `B.wall(W,'x'|'z',from,to,fixedCoord,baseY,rows,color,{skip(i,row,n),breakable,tag,len,h,thick})`,
  `B.floor(W,x0,z0,x1,z1,y,color,{hole(i,j,nx,nz),breakable,tag,tile,thick})`,
  `B.stairs(W,x,y,z,'+x'|'-x'|'+z'|'-z',steps,width,color,{rise,run,breakable})`,
  `B.tower(W,cx,cz,half,floors,wallColor,floorColor,baseY,{tag})` -> array of floor-top heights (hollow building, 6.5 per floor, stairs inside).

## Looks

- `E.setSky(top,bottom,fog,fogNear,fogFar)`, `E.setLight(hemi,sun,sunColor)` (defaults 0.66, 0.62), `E.stars(n,color)`.
- `E.slab(x,y,z,sx,sy,sz,color,opacity)` -> a non-colliding see-through or glowing box mesh (water, lava, zones). `E.remove(mesh)`.
- `E.add(threeObject)` for any other THREE object; `E.remove(obj)`. `THREE` is global (r128).
- `E.fx.burst(pos,colorOrArray,count,speed,size,{up,gravity,life})`, `E.fx.flash(pos,radius,color)`, `E.shake(0..1)`, `E.beam(a,b,color)`.
- `E.sfx(name)`: jump hit shoot boom pickup win lose out tick bounce build alarm.
- `E.cam.dist` (default 10), `E.cam.yaw`, `E.cam.pitch` can be set at start.
- Colors are numbers (0xRRGGBB). `VG.COLORS` has red blue green yellow purple orange teal pink white ink stone sand grass wood metal.
- The arcade must NOT look like Roblox: no stud textures, no blocky humanoids, no copied names. Characters are the
  engine's round robots. Go for bright, clean, toy-like maps with a clear color idea per game.

## Characters

- `E.player` exists before `create` runs. `E.bots(n,{team,color})` -> array of bot characters (each has `.brain`).
  `E.spawn({name,color,team,bot})` for one. `E.despawn(c)`. `E.chars` = everyone. `E.living(filter)` = alive ones.
- Fields: `pos`,`vel` (THREE.Vector3), `alive`, `hp`,`maxHp`, `team` (null = everyone is an enemy; same team never
  hurts each other), `color`, `name`, `isBot`, `yaw`, `speed`, `jumpV`, `onGround`, `ground` (box), `blocked`,
  `frozen` (true = cannot move or act), `invuln` (seconds), `gravScale`, `kos`, `outs`, `data` (yours), `tools`, `tool`.
- `c.teleport(x,y,z)`, `c.setTools(['blade','popper',...])`, `c.equip(id)`, `c.use(unitDir,id?)` -> true if it fired,
  `c.chest()`, `c.showTag(bool)`.
- `E.damage(c,amount,byChar|null)` -> true if it landed; `E.kill(c,by)`; `E.respawn(c,x,y,z,shieldSeconds)`; `E.heal(c,amt)`.
  When a character runs out of hp or falls below killY the engine calls your `onDeath(c,by)`; respawning is YOUR job
  (e.g. `E.after(3,()=>E.respawn(c,x,y,z))`). `E.frozen=true` freezes the human player (countdowns).

## Tools (VG.TOOLS)

`blade` (melee 34), `popper` (fast pellet 14), `bouncer` (bouncy ball 30), `rocket` (explodes, breaks bricks),
`bomb` (lobbed, 2.2s fuse, big blast), `wall` (builds a brick wall for 22s), `zapper` (melee instant out),
`catcher` (instant beam, instant out; calls your `onCatch(shooter,hitCharOrNull)`).
The player fires with click / F / the Use button; number keys and the mouse wheel switch tools. You can add your own:
`VG.TOOLS.mytool={name:'Shown Name',cd:seconds,range:n,use(c,dir,E){...}}` (prefix the id with your game id).

## Projectiles and pickups

- `E.shoot(c,unitDir,spec)` from a character; `E.drop(pos,vel,spec)` from anywhere (owner null: hits everyone).
  spec: `speed,r,dmg,life,grav(0..1),bounce(0..1),fuse(true = only explodes when life ends),explode:{r,dmg},color,trail,onHit(c,shot),onLand(hit,shot)`.
- `E.explode(pos,radius,dmg,ownerOrNull,{breaks:false})`.
- `E.pickup({pos,color,size,onTake(c){...; return false to refuse},bots:false,respawn:seconds})` -> spinning pickup. `E.removePickup(p)`.

## Bots (c.brain, a VG.Brain)

The engine calls `brain.step(dt)` every frame for bots: it walks toward `brain.goal` (a Vector3, or null to stand),
jumps when blocked, sidesteps when stuck and refuses to walk off ledges (set `brain.fearless=true` to allow drops,
`brain.maxDrop`, `brain.gapJump`). It is simple steering, NOT pathfinding: bots cannot find stairs or doors by
themselves, so give them goals they can reach in a straight-ish line, or chains of waypoints.
- `brain.goal`, `brain.arrive` (distance), `brain.arrived`, `brain.speedMul`, `brain.skill` (0..1 aim), `brain.data` (yours).
- `brain.nearest(filter)` -> nearest living character, `brain.dist(charOrPoint)`, `brain.canSee(char)`,
  `brain.fireAt(charOrPoint,toolId,spread?)` (equips and uses the tool with aim wobble).
- Decide what each bot does in your `update(dt)` on a slow timer (every 0.3 to 1.5 s per bot), not every frame.

## HUD, timers, ending

- `E.status(text)` top bar, `E.announce(text,seconds)` big centre text, `E.score([{label,value,color,me}])` list top-right.
- `E.time` seconds since start, `E.fmt(seconds)` -> "1:05", `E.after(sec,fn)`, `E.every(sec,fn)`, `E.cancel(timer)`.
- `E.finish({win:true|false, title:'...', stars:1..3 (wins only), lines:['one or two plain sentences']})` ends the
  round and shows the end panel (Next level / Try again / Back to games). Call it exactly once. Every round MUST be
  able to end both ways (win and lose) and never hang: use a time limit where needed.
- Levels: `E.level` is 1..`levels`. Level 1 should be easy for a 10-year-old; each level clearly harder
  (more or smarter bots, less time, tougher map). Give 3 stars for a strong win, 1 for a bare win.

## Words on screen

Plain, short, friendly, kid-safe. No emoji. No mention of AI, Claude or Roblox. Never show "undefined" or NaN.

## Testing (required before you report back)

From `/home/claude/arcade`:

```
python3 test/test.py <id> --level 1 --ff 240 --auto --at 15,60     # full match on autopilot
python3 test/test.py <id> --level 5 --ff 300 --auto
python3 test/test.py <id> --ff 10 --keys w                          # player just walks forward
```

`--ff N` fast-forwards N seconds of game time; `--auto` sets `window.VG_AUTOPILOT=true`, so the engine calls your
`autopilot(dt)` instead of reading the keyboard (give the player a brain: `p.brain=new VG.Brain(p,E)`, set its goal
and call `p.use(...)`; the engine steps `p.brain` for you in autopilot). `--at` saves extra screenshots at those times.
It prints one JSON line of state, a line per bot, the screenshot path (`test/shot-<id>.png`, `-15.png`, ...) and any
errors. Use the Read tool on the screenshots to LOOK at your map and fix what looks wrong.
You are done when: zero errors at levels 1, 3 and 5; rounds reach `"over": true` on autopilot; a win is reachable
(shown by a test run, tune the autopilot or level if not); and the screenshots look good.

## Playing with friends (net.js)

`net.js` adds parties. A party shares one map (the engine seeds `Math.random` during `create`, so build the whole map
in `create`), shows every friend as a character, and the party leader's device runs the computer players for everyone.
Friends are NOT in `E.chars` (your game logic never sees them); they are in `E.remotes`, and tools, shots and blasts
reach them through `E.targets()`. A hit on a character another device owns is sent to that device, which applies it.
Rules for game files: create every bot inside `create` in a fixed order; do not rely on `Math.random` giving the same
values on two devices after `create`. Test with `python3 test/mp.py <id> --auto` and `python3 test/mp2.py`.
