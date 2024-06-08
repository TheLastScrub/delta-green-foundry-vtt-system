function GetNotesFromInput(inputText) {
  const matchStr = "(?:ATTACKS:[\\S\\s]*?\\.\\n)([\\S\\s]*)";
  const re = new RegExp(matchStr, "gi");
  const results = inputText.match(re);
  let notes = "";

  try {
    if (results != null && results.length > 0) {
      [notes] = results;
      notes = notes.replace("\n", "&nbsp;");
    }
  } catch (ex) {
    console.log("GetNotesFromInput Error");
    console.log(ex);
  }

  return notes;
}

// call this within a world as: game.deltagreen.ParseDeltaGreenStatBlock()
function GetTypeSkillRatingsFromInput(inputText) {
  const matchStr =
    "(Art|Craft|Foreign Language|Native Language|Military Science|Pilot|Science)\\s?\\((\\w.*?)\\)\\s?(\\d?\\d)%";

  inputText = inputText.replace(/[\n\r]/g, " ");

  const re = new RegExp(matchStr, "gi");

  const matches = [];
  let match;

  try {
    // This is probably one of the few times where its recommended to assign within a while loop.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
    // eslint-disable-next-line no-cond-assign
    while ((match = re.exec(inputText))) {
      matches.push({
        group: match[1],
        label: match[2],
        proficiency: parseInt(match[3]),
        failure: false,
      });
    }
  } catch (ex) {
    console.log("GetAttributeFromInput Error");
    console.log(ex);
  }

  return matches;
}

function GetAttributeFromInput(inputText, attribute) {
  const matchStr = `(?:${attribute}\\s)(\\d\\d?)`;
  const re = new RegExp(matchStr, "i");
  const results = inputText.match(re);
  let attributeScore = 10;

  try {
    if (results != null && results.length > 1) {
      attributeScore = parseInt(results[1]);
    } else {
      attributeScore = 0;
    }
  } catch (ex) {
    console.log("GetAttributeFromInput Error");
    console.log(ex);
  }

  return attributeScore;
}

function GetSkillRatingsFromInput(inputText, skill) {
  const matchStr = `(?:${skill}\\n?\\s?\\n?)(\\d\\d?)`;
  const re = new RegExp(matchStr, "i");
  const results = inputText.match(re);
  let skillValue = 0;

  try {
    if (results != null && results.length > 1) {
      skillValue = parseInt(results[1]);
    }
  } catch (ex) {
    console.log("GetAttributeFromInput Error");
    console.log(ex);
  }

  return skillValue;
}

async function RegexParseNpcStatBlock(inputStr, actorType) {
  const actorData = {};

  let shortDescription = "";

  actorData.type = actorType;
  actorData.data = {};
  actorData.data.statistics = {};
  actorData.data.skills = {};
  actorData.data.typedSkills = {};
  actorData.data.physical = {};

  actorData.data.health = { value: 10, min: 0, max: 10 };
  actorData.data.wp = { value: 10, min: 0, max: 10 };

  let tempStr = "";
  let arr = [];

  tempStr = inputStr.split(/\r?\n/);

  if (tempStr.length > 0) {
    [actorData.name] = tempStr;

    // set the alternate description/profession/etc.
    // if this doesn't exist, the next line should be the attributes starting with strength
    // so if the second line starts with "STR" then just leave it be.
    if (
      tempStr.length > 1 &&
      tempStr[1].substring(0, 3) !== "STR" &&
      tempStr[1].substring(0, 3) !== "CON" &&
      tempStr[1].substring(0, 3) !== "DEX" &&
      tempStr[1].substring(0, 3) !== "INT" &&
      tempStr[1].substring(0, 3) !== "POW" &&
      tempStr[1].substring(0, 3) !== "CHA"
    ) {
      [, shortDescription] = tempStr;
    }
  } else {
    actorData.name = "Unknown";
  }

  if (actorType === "agent") {
    actorData.data.physical = {
      description: shortDescription,
      wounds: "",
      firstAidAttempted: false,
    };
  } else if (actorType === "npc" || actorType === "unnatural") {
    actorData.data.shortDescription = shortDescription;
  }

  actorData.data.statistics.str = {
    value: GetAttributeFromInput(inputStr, "STR"),
    distinguishing_feature: "",
  };
  actorData.data.statistics.con = {
    value: GetAttributeFromInput(inputStr, "CON"),
    distinguishing_feature: "",
  };
  actorData.data.statistics.dex = {
    value: GetAttributeFromInput(inputStr, "DEX"),
    distinguishing_feature: "",
  };
  actorData.data.statistics.int = {
    value: GetAttributeFromInput(inputStr, "INT"),
    distinguishing_feature: "",
  };
  actorData.data.statistics.pow = {
    value: GetAttributeFromInput(inputStr, "POW"),
    distinguishing_feature: "",
  };
  actorData.data.statistics.cha = {
    value: GetAttributeFromInput(inputStr, "CHA"),
    distinguishing_feature: "",
  };

  if (actorType === "npc" || actorType === "unnatural") {
    // don't want to try to set HP/SAN for player characters
    actorData.data.health = {
      min: 0,
      max: GetAttributeFromInput(inputStr, "HP"),
      value: GetAttributeFromInput(inputStr, "HP"),
    };
    actorData.data.sanity = {
      max: actorData.data.statistics.pow.value * 5,
      value: GetAttributeFromInput(inputStr, "SAN"),
      currentBreakingPoint: GetAttributeFromInput(inputStr, "BREAKING POINT"),
    };
    actorData.data.wp = {
      max: actorData.data.statistics.pow.value,
      value: GetAttributeFromInput(inputStr, "WP"),
      min: 0,
    };
  }

  actorData.data.skills.accounting = {
    label: "Accounting",
    proficiency: GetSkillRatingsFromInput(inputStr, "ACCOUNTING"),
    failure: false,
  };
  actorData.data.skills.alertness = {
    label: "Alertness",
    proficiency: GetSkillRatingsFromInput(inputStr, "ALERTNESS"),
    failure: false,
  };
  actorData.data.skills.anthropology = {
    label: "Anthropology",
    proficiency: GetSkillRatingsFromInput(inputStr, "ANTHROPOLOGY"),
    failure: false,
  };
  actorData.data.skills.archeology = {
    label: "Archeology",
    proficiency: GetSkillRatingsFromInput(inputStr, "ARCHEOLOGY|ARCHAEOLOGY"),
    failure: false,
  }; // damn you british spellings
  actorData.data.skills.artillery = {
    label: "Artillery",
    proficiency: GetSkillRatingsFromInput(inputStr, "ARTILLERY"),
    failure: false,
  };
  actorData.data.skills.athletics = {
    label: "Athletics",
    proficiency: GetSkillRatingsFromInput(inputStr, "ATHLETICS"),
    failure: false,
  };
  actorData.data.skills.bureaucracy = {
    label: "Bureaucracy",
    proficiency: GetSkillRatingsFromInput(inputStr, "BUREAUCRACY"),
    failure: false,
  };
  actorData.data.skills.computer_science = {
    label: "Computer Science",
    proficiency: GetSkillRatingsFromInput(inputStr, "COMPUTER SCIENCE"),
    failure: false,
  };
  actorData.data.skills.criminology = {
    label: "Criminology",
    proficiency: GetSkillRatingsFromInput(inputStr, "CRIMINOLOGY"),
    failure: false,
  };
  actorData.data.skills.demolitions = {
    label: "Demolitions",
    proficiency: GetSkillRatingsFromInput(inputStr, "DEMOLITIONS"),
    failure: false,
  };
  actorData.data.skills.disguise = {
    label: "Disguise",
    proficiency: GetSkillRatingsFromInput(inputStr, "DISGUISE"),
    failure: false,
  };
  actorData.data.skills.dodge = {
    label: "Dodge",
    proficiency: GetSkillRatingsFromInput(inputStr, "DODGE"),
    failure: false,
  };
  actorData.data.skills.drive = {
    label: "Drive",
    proficiency: GetSkillRatingsFromInput(inputStr, "DRIVE"),
    failure: false,
  };

  // Impossible Landscapes seems to favor 'Driving' as the name for this instead for some reason
  if (actorData.data.skills.drive.proficiency === 0) {
    actorData.data.skills.drive = {
      label: "Drive",
      proficiency: GetSkillRatingsFromInput(inputStr, "DRIVING"),
      failure: false,
    };
  }

  actorData.data.skills.firearms = {
    label: "Firearms",
    proficiency: GetSkillRatingsFromInput(inputStr, "FIREARMS"),
    failure: false,
  };
  actorData.data.skills.first_aid = {
    label: "First Adi",
    proficiency: GetSkillRatingsFromInput(inputStr, "FIRST AID"),
    failure: false,
  };
  actorData.data.skills.forensics = {
    label: "Forensics",
    proficiency: GetSkillRatingsFromInput(inputStr, "FORENSICS"),
    failure: false,
  };
  actorData.data.skills.heavy_machinery = {
    label: "Heavy Machinery",
    proficiency: GetSkillRatingsFromInput(inputStr, "HEAVY MACHINERY"),
    failure: false,
  }; // template.json has typo on heavy machinery...
  actorData.data.skills.heavy_weapons = {
    label: "Heavy Weapons",
    proficiency: GetSkillRatingsFromInput(inputStr, "HEAVY WEAPONS"),
    failure: false,
  };
  actorData.data.skills.history = {
    label: "History",
    proficiency: GetSkillRatingsFromInput(inputStr, "HISTORY"),
    failure: false,
  };
  actorData.data.skills.humint = {
    label: "HUMINT",
    proficiency: GetSkillRatingsFromInput(inputStr, "HUMINT"),
    failure: false,
  };
  actorData.data.skills.law = {
    label: "Law",
    proficiency: GetSkillRatingsFromInput(inputStr, "LAW"),
    failure: false,
  };
  actorData.data.skills.medicine = {
    label: "Medicine",
    proficiency: GetSkillRatingsFromInput(inputStr, "MEDICINE"),
    failure: false,
  };
  actorData.data.skills.melee_weapons = {
    label: "Melee Weapons",
    proficiency: GetSkillRatingsFromInput(inputStr, "MELEE WEAPONS"),
    failure: false,
  };
  actorData.data.skills.navigate = {
    label: "Navigate",
    proficiency: GetSkillRatingsFromInput(inputStr, "NAVIGATE"),
    failure: false,
  };
  actorData.data.skills.occult = {
    label: "Occult",
    proficiency: GetSkillRatingsFromInput(inputStr, "OCCULT"),
    failure: false,
  };
  actorData.data.skills.persuade = {
    label: "Persuade",
    proficiency: GetSkillRatingsFromInput(inputStr, "PERSUADE"),
    failure: false,
  };
  actorData.data.skills.pharmacy = {
    label: "Pharmacy",
    proficiency: GetSkillRatingsFromInput(inputStr, "PHARMACY"),
    failure: false,
  };
  actorData.data.skills.psychotherapy = {
    label: "Psychotherapy",
    proficiency: GetSkillRatingsFromInput(inputStr, "PSYCHOTHERAPY"),
    failure: false,
  };
  actorData.data.skills.ride = {
    label: "Ride",
    proficiency: GetSkillRatingsFromInput(inputStr, "RIDE"),
    failure: false,
  };
  actorData.data.skills.search = {
    label: "Search",
    proficiency: GetSkillRatingsFromInput(inputStr, "SEARCH"),
    failure: false,
  };
  actorData.data.skills.sigint = {
    label: "SIGINT",
    proficiency: GetSkillRatingsFromInput(inputStr, "SIGINT"),
    failure: false,
  };
  actorData.data.skills.stealth = {
    label: "Stealth",
    proficiency: GetSkillRatingsFromInput(inputStr, "STEALTH"),
    failure: false,
  };
  actorData.data.skills.surgery = {
    label: "Surgery",
    proficiency: GetSkillRatingsFromInput(inputStr, "SURGERY"),
    failure: false,
  };
  actorData.data.skills.survival = {
    label: "Survival",
    proficiency: GetSkillRatingsFromInput(inputStr, "SURVIVAL"),
    failure: false,
  };
  actorData.data.skills.swim = {
    label: "Swim",
    proficiency: GetSkillRatingsFromInput(inputStr, "SWIM"),
    failure: false,
  };
  actorData.data.skills.unarmed_combat = {
    label: "Unarmed Combat",
    proficiency: GetSkillRatingsFromInput(inputStr, "UNARMED COMBAT"),
    failure: false,
  };
  actorData.data.skills.unnatural = {
    label: "Unnatural",
    proficiency: GetSkillRatingsFromInput(inputStr, "UNNATURAL"),
    failure: false,
  };

  // some npcs/unnatural have other skills
  if (GetSkillRatingsFromInput(inputStr, "FLIGHT") > 0) {
    actorData.data.skills.flight = {
      label: "Flight",
      proficiency: GetSkillRatingsFromInput(inputStr, "FLIGHT"),
      failure: false,
    };
  }

  arr = GetTypeSkillRatingsFromInput(inputStr);

  for (let index = 0; index < arr.length; index += 1) {
    const element = arr[index];
    actorData.data.typedSkills[`tskill_${index.toString()}`] = element;
  }

  if (actorType === "npc" || actorType === "unnatural") {
    actorData.data.notes = GetNotesFromInput(inputStr);
  }

  console.log(actorData);

  const newActors = await Actor.createDocuments([actorData]);

  newActors[0].sheet.render(true);
}

async function GetUserInput() {
  const content = `<form>
            <div class="form-group">
                <label>Output Actor Type: </label>
                <div class="form-fields">
                    <select name="actor-type">                        
                        <option value="npc" selected>NPC</option>
                        <option value="unnatural">Unnatural</option>
                        <option value="agent">Agent</option>
                    </select>
                </div>
            </div>
            <br>
            <label>Stat Block Text (English Only): </label>
            <div class="form-group">
                <div class="form-fields">
                    <textarea class="stat-block-input" name="parse-input"></textarea>
                </div>
            </div>
    </form>`;

  new Dialog({
    title: "Stat Block Parser",
    content,
    buttons: {
      roll: {
        label: "PARSE",
        callback: async (html) => {
          const textInput = html.find("[name=parse-input]")[0].value;

          const actorType = html.find("[name=actor-type]")[0].value;

          RegexParseNpcStatBlock(textInput, actorType);
        },
      },
    },
  }).render(true);
}

export default async function ParseDeltaGreenStatBlock() {
  GetUserInput();
}
