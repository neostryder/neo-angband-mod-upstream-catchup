// upstream-catchup - generated from plugin.ts by neo-angband-mod-build
// (@rpgm-tools/neo-angband-mod-sdk). Edit the TypeScript source, not this file.

// tiles.ts
var CATCHUP_TILE_SETS = [
  {
    pack: "gervais",
    sha: "7e8b58325",
    date: "2026-03-10",
    site: "lib/tiles/gervais/graf-dvg.prf",
    prf: "monster:Beorn, the Mountain Bear:0x93:0xAF\n"
  },
  {
    pack: "shockbolt",
    sha: "2e9703d42",
    date: "2026-03-17",
    site: "lib/tiles/shockbolt/graf-shb-dark.prf, graf-shb-light.prf",
    prf: "object:shield:Knight's Shield:0x80:0xD4\n"
  },
  {
    pack: "nomad",
    sha: "9b04b692d",
    date: "2026-03-18",
    site: "lib/tiles/nomad/graf-nmd.prf",
    prf: "object:food:Sip of Miruvor:0x8A:0x90\nobject:food:Draught of the Ents:0x8A:0x91\n"
  },
  {
    pack: "adam-bolt",
    sha: "655812a54",
    date: "2026-03-20",
    site: "lib/tiles/adam-bolt/graf-new.prf",
    prf: "object:food:Sip of Miruvor:0x8E:0x87\nmonster:old forest tree:0xB9:0x82\nmonster:witch:0xB2:0x8C\nmonster:blackguard:0xB8:0x86\nmonster:Old Man Willow:0xB8:0x83\nmonster:red-hatted elf:0xB3:0x87\nmonster:Father Christmas:0xB3:0x88\nmonster:d\xFAnadan of Angmar:0xB2:0x82\n"
  }
];
function catchupTileSetFor(pack) {
  return CATCHUP_TILE_SETS.find((s) => s.pack === pack) ?? null;
}
function applyCatchupTiles(fill, registries, core) {
  if (registries === void 0) return 0;
  if (fill.pack.engine !== "tilesheet") return 0;
  const set = catchupTileSetFor(fill.pack.id);
  if (set === null) return 0;
  const map = core.parseTilePrefs(set.prf, {
    features: registries.features,
    objects: registries.objects,
    monsters: registries.monsters,
    traps: registries.traps
  });
  let written = 0;
  map.monster.forEach((tile, ridx) => {
    if (tile !== void 0 && fill.fillMonster(ridx, tile)) written += 1;
  });
  map.object.forEach((tile, kidx) => {
    if (tile !== void 0 && fill.fillObject(kidx, tile)) written += 1;
  });
  return written;
}

// radius.ts
function clampBlastRadius(rad, maxRange) {
  return rad > maxRange ? maxRange : rad;
}

// shape-flags.ts
function learnShapeObviousFlagsDirectly() {
  return true;
}

// tracking.ts
function refreshRevisitedTracking(chunk, frozenAt, now) {
  const increment = Math.trunc(now / 10) - Math.trunc(frozenAt / 10);
  for (let y = 1; y < chunk.height - 1; y++) {
    for (let x = 1; x < chunk.width - 1; x++) {
      const i = y * chunk.width + x;
      const scent = chunk.scent[i] ?? 0;
      if (scent > 0) {
        if (increment <= 65535 && scent <= 65535 - increment) {
          chunk.scent[i] = scent + increment;
        } else {
          chunk.scent[i] = 0;
        }
      }
      chunk.noise[i] = 0;
    }
  }
}

// plugin.ts
var plugin_default = {
  api: 1,
  /*
   * The BEHAVIOUR half of the mod. `hooks` is a factory over this mod's own
   * resolved flags, called once per enabled mod, and it must be free of side
   * effects: the host calls it again for the conflict report.
   *
   * A rule that is off contributes NO KEY, rather than a key holding a function
   * that declines. An absent member is the difference between core taking its
   * faithful path and core calling into a mod to be told to take it - and the
   * host reads the keys back to tell a player which mods touch which behaviour,
   * so a mod that always contributed would always be listed.
   */
  hooks(ctx) {
    const out = {};
    if (ctx.flags["catchup.projections"] === true) {
      out.projectionRadius = clampBlastRadius;
    }
    if (ctx.flags["catchup.shapeFlags"] === true) {
      out.shapeLearnObviousFlagsDirectly = learnShapeObviousFlagsDirectly;
    }
    if (ctx.flags["catchup.levelRevisitTracking"] === true) {
      out.levelRevisited = refreshRevisitedTracking;
    }
    return out;
  },
  register(host, ctx) {
    if (ctx.flags["catchup.tiles"] === true) {
      host.tiles.register((fill) => {
        applyCatchupTiles(fill, ctx.registries, ctx.core);
      });
    }
  }
};
export {
  plugin_default as default
};
