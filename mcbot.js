const mineflayer = require('mineflayer');
const pvp = require('mineflayer-pvp').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const armorManager = require('mineflayer-armor-manager');
const GoalFollow = goals.GoalFollow;
const bot = mineflayer.createBot({
  host: 'localhost',//'floofserver.aternos.me', // minecraft server ip
  username: 'Hyperspace', // username or email, switch if you want to change accounts
  // auth: 'offline' // for offline mode servers, you can set this to 'offline'
  port: 25565,                // only set if you need a port that isn't 25565
  // version: false,             // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
  // password: '12345678'        // set if you want to use password-based auth (may be unreliable). If specified, the `username` must be an email
  loadInternalPlugins: true,
  logErrors: false
})
bot.loadPlugin(pvp);
bot.loadPlugin(armorManager);
bot.loadPlugin(pathfinder);
const mcData = require('minecraft-data')(bot.version);
function getProfile(id) {
    const bot = Bot.bots.get(id);

    if (bot === undefined) {
        return;
    }

    const data = {};

    data.health = bot.bot.health;
    data.food = bot.bot.food;
    data.saturation = bot.bot.foodSaturation;
    data.position = Bot.posString(bot.bot.entity.position);
    data.armor = bot.bot.inventory.slots.slice(5, 9).map(item => ({
        name: bot.bot.registry.items[item.type].displayName,
        healthPercent: +((1 - item.nbt.value.Damage.value / item.maxDurability) * 100).toFixed(2)
    }));
    data.tools = bot.bot.inventory.slots.slice(9).filter(item => item != null && item.nbt != null && item.nbt.value.Damage != null).map(item => ({
        name: bot.bot.registry.items[item.type].displayName,
        healthPercent: +((1 - item.nbt.value.Damage.value / item.maxDurability) * 100).toFixed(2)
    }));

    return data;
}
// bot.on('chat', (username, message) => {
//   if (username === bot.username) return
//   bot.chat(message)
// })
const register = () => {
    bot.chat("/register HyperspaceBot1 HyperspaceBot1");
}
const login = () => {
    bot.chat("/login HyperspaceBot1");
}
// Follow Command
function followPlayer(){
    const followedplayer = bot.players["Hyperlatrix"];
    if(!followedplayer || !followedplayer.entity){
        bot.chat("Cannot see Hyperlatrix!");
        return;
    }

    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    movements.scafoldingBlocks = [];
    movements.scafoldingBlocks.push(mcData.blocksByName.dirt.id);
    movements.scafoldingBlocks.push(mcData.blocksByName.cobblestone.id);
    bot.pathfinder.setMovements(movements);
    const goal = new GoalFollow(followedplayer.entity, 1);
    bot.pathfinder.setGoal(goal, true);
}
//Login
bot.on('spawn',login);
//Disconnect
bot.on('chat',(username, message) => {
    if (username === "Hyperlatrix"){
        if(message === "h.disconnect"){
            bot.quit();
        }
    }
})
//Follow Command (continued)
bot.on('chat',(username,message) => {
    if (username === "Hyperlatrix"){
        if(message === "h.follow"){
            followPlayer();
        }
        else if(message === "h.stopfollow"){
            bot.pathfinder.stop();
        }
        else if(message === "h.fstopfollow"){
            bot.pathfinder.setGoal(null);
        }
    }
})
bot.on('chat',(username,message) => {
    if (username === "Hyperlatrix"){
        if(message === "h.coords"){
            botx = bot.entity.position.x;
            boty = bot.entity.position.y;
            botz = bot.entity.position.z;
            toString(botx);
            toString(boty);
            toString(botz);
            let coords = '';
            coords += botx;
            coords += " ";
            coords += boty;
            coords += " ";
            coords += botz;
            bot.chat(coords);
        }
    }
})
//Echo
bot.on('chat',(username, message) => {
    if (username === "Hyperlatrix"){
        if(message.startsWith("h.echo")){
            bot.chat(message.substring(6))
        }
    }
})
//Eval
bot.on('chat',(username, message) => {
    if (username === "Hyperlatrix"){
        if(message.startsWith("h.eval")){
            bot.chat(eval(message.substring(6)))
        }
    }
})
//PvP Section
bot.on('playerCollect', (collector, itemDrop) => {
    if (collector !== bot.entity) return

    setTimeout(() => {
      const sword = bot.inventory.items().find(item => item.name.includes('sword'))
      if (sword) bot.equip(sword, 'hand')
    }, 150)
  })
  
bot.on('playerCollect', (collector, itemDrop) => {
    if (collector !== bot.entity) return
  
    setTimeout(() => {
      const shield = bot.inventory.items().find(item => item.name.includes('shield'))
      if (shield) bot.equip(shield, 'off-hand')
    }, 250)
  })
  
// PvE Section
let guardPos = null
  
function guardArea (pos) {
    guardPos = pos.clone()
  
    if (!bot.pvp.target) {
      moveToGuardPos()
    }
}
  
function stopGuarding () {
    guardPos = null
    bot.pvp.stop()
    bot.pathfinder.setGoal(null)
}
  
function moveToGuardPos () {
    const mcData = require('minecraft-data')(bot.version)
    console.log(guardPos);
    bot.pathfinder.setMovements(new Movements(bot, mcData))
    bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}
  
bot.on('stoppedAttacking', () => {
    if (guardPos) {
      moveToGuardPos()
    }
})
  
bot.on('physicsTick', () => {
    if (bot.pvp.target) return
    if (bot.pathfinder.isMoving()) return
  
    const entity = bot.nearestEntity()
    if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})
  
bot.on('physicsTick', () => {
    if (!guardPos) return
  
    const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
                        e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?
  
    const entity = bot.nearestEntity(filter)
    if (entity) {
      bot.pvp.attack(entity)
    }
})
  
bot.on('chat', (username, message) => {
    if(username === "Hyperlatrix"){
        if (message === 'h.guard') {
            const player = bot.players[username]
  
            if (!player) {
                bot.chat("I can't see you.");
                return
            }
            else{
                bot.chat('I will guard that location.')
                guardArea(player.entity?.position)
                console.log(player.entity)
            }
        }
  
        if (message.startsWith('h.killplayer')) {
            const playerName = message.substring(13);
            const player = bot.players[playerName];
            if (!player) {
            bot.chat("I can't see that player.")
            return
            }
  
            bot.chat('Order Initiated.')
            bot.pvp.attack(player.entity)
        }
        if(message === "h.stopkillplayer"){
            bot.pvp.stop();
            bot.chat("Stopped kill order.")
        }
  
        if (message === 'h.stopguard') {
            bot.chat('I will no longer guard this area.')
            stopGuarding()
        }
    }
  })
// Collect (not done)
bot.on('chat', async (username, message) => {
    if(username === "Hyperlatrix"){
    const args = message.split(' ')
    if (args[0] !== 'h.collect') return

    let count = 1
    if (args.length === 3) count = parseInt(args[1])
  
    let type = args[1]
    if (args.length === 3) type = args[2]
  
    const blockType = mcData.blocksByName[type]
    if (!blockType) {
      return
    }
  
    const blocks = bot.findBlocks({
      matching: blockType.id,
      maxDistance: 64,
      count: count
    })
  
    if (blocks.length === 0) {
      bot.chat("I don't see that block nearby.")
      return
    }
  
    const targets = []
    for (let i = 0; i < Math.min(blocks.length, count); i++) {
      targets.push(bot.blockAt(blocks[i]))
    }
  
    bot.chat(`Found ${targets.length} ${type}(s)`)
  
    try {
        await bot.collectBlock.collect(targets)
      // All blocks have been collected.
        bot.chat('Done')
        }       
        catch (err) {
      // An error occurred, report it.
            bot.chat(err.message)
            console.log(err)
            }
        }
  })

// Log errors and kick reasons:
bot.on('kicked', console.log)
bot.on('end', console.log)
bot.on('error', console.log)