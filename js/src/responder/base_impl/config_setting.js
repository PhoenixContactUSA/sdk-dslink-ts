// part of dslink.responder;
export class ConfigSetting {
    constructor() {
        this.defaultValue = m.hasOwnProperty('default') ? m['default'] : null;
    }
    hasOwnProperty() { }
}
{ }
setConfig(value, object, node, LocalNodeImpl, responder, Responder);
DSError;
{
    if (node.configs[name] != value) {
        node.configs[name] = value;
        node.updateList(name);
    }
    return null;
}
removeConfig(node, LocalNodeImpl, responder, Responder);
DSError;
{
    if (node.configs.hasOwnProperty(name)) {
        node.configs.remove(name);
        node.updateList(name);
    }
    return null;
}
export class Configs {
}
Configs._globalConfigs = ;
const { r, '$is': , const: { 'type': , 'profile':  }, r, '$interface': , const: { 'type': , 'interface':  }, 
/// list of permissions
r, '$permissions': , const: { 'type': , 'list': , 'require': Permission, CONFIG, 'writable': Permission, CONFIG, }, 
/// the display name
r, '$name': , const: { 'type': , 'string':  }, 
/// type of subscription stream
r, '$type': , const: { 'type': , 'type':  }, 
/// permission needed to invoke
r, '$invokable': , const: { 'type': , 'permission': , 'default': , 'read':  }, 
/// permission needed to set
r, '$writable': , const: { 'type': , 'permission': , 'default': , 'never':  }, 
/// config settings, only used by profile nodes
r, '$settings': , const: { 'type': , 'map':  }, 
/// params of invoke method
r, '$params': , const: { 'type': , 'list':  }, 
/// stream columns of invoke method
r, '$columns': , const: { 'type': , 'list':  }, 
/// stream meta of invoke method
r, '$streamMeta': , const: { 'type': , 'list':  }
// not serializable
 };
global: Configs = new Configs()..load(this._globalConfigs);
defaultConfig: ConfigSetting =
    new ConfigSetting.fromMap('');
const {};
getConfig(name, string, profile, Node);
ConfigSetting;
{
    if (global.configs.hasOwnProperty(name)) {
        return global.configs[name];
    }
    if (profile instanceof DefinitionNode && profile.configs.hasOwnProperty(name)) {
        return profile.configs[name];
    }
    return defaultConfig;
}
configs: {
    [key, string];
    ConfigSetting;
}
{ }
;
load(inputs, object);
{
    inputs.forEach((name, m) => {
        if ((m != null && m instanceof Object)) {
            configs[name] = new ConfigSetting.fromMap(name, m);
        }
    });
}
//# sourceMappingURL=config_setting.js.map