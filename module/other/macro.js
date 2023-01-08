
function GetTypeSkillRatingsFromInput(inputText){
    
    let matchStr = "(Art|Craft|Foreign Language|Native Language|Military Science|Pilot|Science)\\s?\\((\\w.*?)\\)\\s?(\\d?\\d)%";
    let re = new RegExp(matchStr, "gi");
    
    let matches = [];
    let match;
    
    try{
        while(match = re.exec(inputText)){
            matches.push({group: match[1], label: match[2], proficiency: parseInt(match[3]), failure: false});
        }
    }
    catch(ex){
        console.log('GetAttributeFromInput Error');
        console.log(ex);
    }
    
    return matches;
}

function GetAttributeFromInput(inputText, attribute){
    
    let matchStr = "(?:" + attribute + "\\s)(\\d\\d?)";
    let re = new RegExp(matchStr, "i");
    let results = inputText.match(re);
    let attributeScore = 10;
    
    try{
        if(results != null && results.length > 1){
            attributeScore = parseInt(results[1]);
        }
        else{
            attributeScore = 0;
        }
    }
    catch(ex){
        console.log('GetAttributeFromInput Error');
        console.log(ex);
    }
    
    return attributeScore;
}

function GetSkillRatingsFromInput(inputText, skill){
    
    let matchStr = "(?:" + skill + "\\s)(\\d\\d?)";
    let re = new RegExp(matchStr, "i");
    let results = inputText.match(re);
    let skillValue = 0;
    
    try{
        if(results != null && results.length > 1){
            skillValue = parseInt(results[1]);
        }
    }
    catch(ex){
        console.log('GetAttributeFromInput Error');
        console.log(ex);
    }
    
    return skillValue;
}

async function RegexParseNpcStatBlock(inputStr, actorType){
    let actorData = {};

    let shortDescription = "";
    
    actorData.type = actorType;
    actorData.data = {};
    actorData.data.statistics = {};
    actorData.data.skills = {};
    actorData.data.typedSkills = {};
    actorData.data.physical = {};

    actorData.data.health = {value: 10, min: 0, max: 10};
    actorData.data.wp = {value: 10, min: 0, max: 10};
    
    let tempStr = "";
    let arr = [];
    
    tempStr = inputStr.split(/\r?\n/);
    
    if(tempStr.length > 1){
        actorData.name = tempStr[0];
        shortDescription = tempStr[1];
    }
    else{
        actorData.name = "Unknown";
    }

    if(actorType === 'agent'){
        actorData.data.physical = {description: shortDescription, wounds: "", firstAidAttempted: false}
    }
    else if(actorType === 'npc'){
        actorData.data.shortDescription = shortDescription;
    }
    
    actorData.data.statistics.str = {value: GetAttributeFromInput(inputStr, "STR"), distinguishing_feature: ""};
    actorData.data.statistics.con = {value: GetAttributeFromInput(inputStr, "CON"), distinguishing_feature: ""};
    actorData.data.statistics.dex = {value: GetAttributeFromInput(inputStr, "DEX"), distinguishing_feature: ""};
    actorData.data.statistics.int = {value: GetAttributeFromInput(inputStr, "INT"), distinguishing_feature: ""};
    actorData.data.statistics.pow = {value: GetAttributeFromInput(inputStr, "POW"), distinguishing_feature: ""};
    actorData.data.statistics.cha = {value: GetAttributeFromInput(inputStr, "CHA"), distinguishing_feature: ""};

    if(actorType === 'npc' || actorType === 'unnatural'){
        // don't want to try to set HP/SAN for player characters
        actorData.data.health = {min: 0, max: GetAttributeFromInput(inputStr, "HP"), value: GetAttributeFromInput(inputStr, "HP")};
        actorData.data.sanity = {max: actorData.data.statistics.pow.value * 5, value: GetAttributeFromInput(inputStr, "SAN"), currentBreakingPoint: GetAttributeFromInput(inputStr, "BREAKING POINT")};
        actorData.data.wp = {max: actorData.data.statistics.pow.value, value: GetAttributeFromInput(inputStr, "WP"), min: 0};
    }

    actorData.data.skills.accounting = {"label": "Accounting", proficiency: GetSkillRatingsFromInput(inputStr, "ACCOUNTING"), failure: false};
    actorData.data.skills.alertness = {"label": "Alertness", proficiency: GetSkillRatingsFromInput(inputStr, "ALERTNESS"), failure: false};
    actorData.data.skills.anthropology = {"label": "Anthropology", proficiency: GetSkillRatingsFromInput(inputStr, "ANTHROPOLOGY"), failure: false};
    actorData.data.skills.archeology = {"label": "Archeology", proficiency: GetSkillRatingsFromInput(inputStr, "ARCHEOLOGY|ARCHAEOLOGY"), failure: false}; // damn you british spellings
    actorData.data.skills.artillery = {"label": "Artillery", proficiency: GetSkillRatingsFromInput(inputStr, "ARTILLERY"), failure: false};
    actorData.data.skills.athletics = {"label": "Athletics", proficiency: GetSkillRatingsFromInput(inputStr, "ATHLETICS"), failure: false};
    actorData.data.skills.bureaucracy = {"label": "Bureaucracy", proficiency: GetSkillRatingsFromInput(inputStr, "BUREAUCRACY"), failure: false};
    actorData.data.skills.computer_science = {"label": "Computer Science", proficiency: GetSkillRatingsFromInput(inputStr, "COMPUTER SCIENCE"), failure: false};
    actorData.data.skills.criminology = {"label": "Criminology", proficiency: GetSkillRatingsFromInput(inputStr, "CRIMINOLOGY"), failure: false};
    actorData.data.skills.demolitions = {"label": "Demolitions", proficiency: GetSkillRatingsFromInput(inputStr, "DEMOLITIONS"), failure: false};
    actorData.data.skills.disguise = {"label": "Disguise", proficiency: GetSkillRatingsFromInput(inputStr, "DISGUISE"), failure: false};
    actorData.data.skills.dodge = {"label": "Dodge", proficiency: GetSkillRatingsFromInput(inputStr, "DODGE"), failure: false};
    actorData.data.skills.drive = {"label": "Drive", proficiency: GetSkillRatingsFromInput(inputStr, "DRIVE"), failure: false};
    actorData.data.skills.firearms = {"label": "Firearms", proficiency: GetSkillRatingsFromInput(inputStr, "FIREARMS"), failure: false};
    actorData.data.skills.first_aid = {"label": "First Adi", proficiency: GetSkillRatingsFromInput(inputStr, "FIRST AID"), failure: false};
    actorData.data.skills.forensics = {"label": "Forensics", proficiency: GetSkillRatingsFromInput(inputStr, "FORENSICS"), failure: false};
    actorData.data.skills.heavy_machinery = {"label": "Heavy Machinery", proficiency: GetSkillRatingsFromInput(inputStr, "HEAVY MACHINERY"), failure: false}; // template.json has typo on heavy machinery...
    actorData.data.skills.heavy_weapons = {"label": "Heavy Weapons", proficiency: GetSkillRatingsFromInput(inputStr, "HEAVY WEAPONS"), failure: false};
    actorData.data.skills.history = {"label": "History", proficiency: GetSkillRatingsFromInput(inputStr, "HISTORY"), failure: false};
    actorData.data.skills.humint = {"label": "HUMINT", proficiency: GetSkillRatingsFromInput(inputStr, "HUMINT"), failure: false};
    actorData.data.skills.law = {"label": "Law", proficiency: GetSkillRatingsFromInput(inputStr, "LAW"), failure: false};
    actorData.data.skills.medicine = {"label": "Medicine", proficiency: GetSkillRatingsFromInput(inputStr, "MEDICINE"), failure: false};
    actorData.data.skills.melee_weapons = {"label": "Melee Weapons", proficiency: GetSkillRatingsFromInput(inputStr, "MELEE WEAPONS"), failure: false};
    actorData.data.skills.navigate = {"label": "Navigate", proficiency: GetSkillRatingsFromInput(inputStr, "NAVIGATE"), failure: false};
    actorData.data.skills.occult = {"label": "Occult", proficiency: GetSkillRatingsFromInput(inputStr, "OCCULT"), failure: false};
    actorData.data.skills.persuade = {"label": "Persuade", proficiency: GetSkillRatingsFromInput(inputStr, "PERSUADE"), failure: false};
    actorData.data.skills.pharmacy = {"label": "Pharmacy", proficiency: GetSkillRatingsFromInput(inputStr, "PHARMACY"), failure: false};
    actorData.data.skills.psychotherapy = {"label": "Psychotherapy", proficiency: GetSkillRatingsFromInput(inputStr, "PSYCHOTHERAPY"), failure: false};
    actorData.data.skills.ride = {"label": "Ride", proficiency: GetSkillRatingsFromInput(inputStr, "RIDE"), failure: false};
    actorData.data.skills.search = {"label": "Search", proficiency: GetSkillRatingsFromInput(inputStr, "SEARCH"), failure: false};
    actorData.data.skills.sigint = {"label": "SIGINT", proficiency: GetSkillRatingsFromInput(inputStr, "SIGINT"), failure: false};
    actorData.data.skills.stealth = {"label": "Stealth", proficiency: GetSkillRatingsFromInput(inputStr, "STEALTH"), failure: false};
    actorData.data.skills.surgery = {"label": "Surgery", proficiency: GetSkillRatingsFromInput(inputStr, "SURGERY"), failure: false};
    actorData.data.skills.survival = {"label": "Survival", proficiency: GetSkillRatingsFromInput(inputStr, "SURVIVAL"), failure: false};
    actorData.data.skills.swim = {"label": "Swim", proficiency: GetSkillRatingsFromInput(inputStr, "SWIM"), failure: false};
    actorData.data.skills.unarmed_combat = {"label": "Unarmed Combat", proficiency: GetSkillRatingsFromInput(inputStr, "UNARMED COMBAT"), failure: false};
    actorData.data.skills.unnatural = {"label": "Unnatural", proficiency: GetSkillRatingsFromInput(inputStr, "UNNATURAL"), failure: false};

    arr = GetTypeSkillRatingsFromInput(inputStr);

    for (let index = 0; index < arr.length; ++index) {
        const element = arr[index];
        actorData.data.typedSkills['tskill_' + index.toString()] = element;
    }
    
    console.log(actorData);

    const newActors = await Actor.createDocuments([actorData]);

    newActors[0].sheet.render(true);
}

async function GetUserInput(){
    const content =  `<form>
            <div class="form-group">
                <label>Actor Type: </label>
                <div class="form-fields">
                    <select name="actor-type">                        
                        <option value="npc" selected>NPC</option>
                        <option value="unnatural">Unnatural</option>
                        <option value="agent">Agent</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Input: </label>
                <div class="form-fields">
                    <textarea name="parse-input"></textarea>
                </div>
            </div>
    </form>`;
    
    new Dialog({
        title: "Stat Block Parser", // Change the title if you want.
        content,
        buttons: {
            roll: {
                label: "PARSE",
                callback: async (html) => {
                    const textInput = html.find("[name=parse-input]")[0].value;
                    
                    const actorType = html.find("[name=actor-type]")[0].value;

                    RegexParseNpcStatBlock(textInput, actorType);
                }
            }
        }
    }).render(true);
}

export async function ParseDeltaGreenStatBlock(){
    GetUserInput();
}