async function FillCompendium() {
    
    console.log('Loading compendium...');
    
    const targetCompName = "pregens";
    const agentsDataPath = 'http://localhost:30000/systems/deltagreen/packs/data-import/pregen-actor-data.json';
    const bondDataPath = 'http://localhost:30000/systems/deltagreen/packs/data-import/fvtt-Item-new-bond.json';
    const unarmedAttackDataPath = 'http://localhost:30000/systems/deltagreen/packs/data-import/fvtt-Item-unarmed-attack.json';
    
    // check if pack already exists, and if it does, delete it to avoid duplicates
    let pack = game.packs.get("world." + targetCompName);
    
    if(typeof pack !== 'undefined'){
        await pack.deleteCompendium();
    }
    
    // create or recreate the pack so we can add everything
    let data = {
        'label': "DG Pregens",
        'entity': "Actor",
        'name': targetCompName
    };
    
    await CompendiumCollection.createCompendium(data);
    
    let targetPack = game.packs.get("world." + targetCompName);
    
    let bondItemTemplate = '';
    
    // get the item data for a placeholder bond
    await fetch(bondDataPath).then(response => response.json()).then(function(response){
        bondItemTemplate = response;
    });
    
    let unarmedAttackItemTemplate = '';
    
    // get the item data for a placeholder bond
    await fetch(unarmedAttackDataPath).then(response => response.json()).then(function(response){
        unarmedAttackItemTemplate = response;
    });
    
    let agentArr = [];
    
    // load JSON file filled with agent stats
    await fetch(agentsDataPath).then(response => response.json()).then(function(response){
        agentArr = Object.entries(response.agents);
    });
    
    //agentArr.forEach(function(item){
    for(var item of agentArr){
            
        agentData = item[1];
        
        let worldActor = await Actor.create(agentData);
            
        await worldActor.createEmbeddedDocuments("Item", bondItemTemplate);
        
        await worldActor.createEmbeddedDocuments("Item", unarmedAttackItemTemplate);
            
        await targetPack.importDocument(worldActor);
                
        await worldActor.delete();
            
    }
}

FillCompendium();