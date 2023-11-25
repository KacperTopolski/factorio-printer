function stringFromCharCodeArray(array) {
    return [...array].map(x => String.fromCharCode(x)).join('');
}

function decode(string) {
    const sliced_string = string.slice(1);
    const as_binary_string = atob(sliced_string);
    const as_binary_array = as_binary_string.split('').map(x => x.charCodeAt(0));
    const inflated = pako.inflate(as_binary_array);
    const json = stringFromCharCodeArray(inflated);
    return JSON.parse(json);
}

function encode(obj) {
    const compressed = pako.deflate(JSON.stringify(obj));
    return '0' + btoa(String.fromCharCode.apply(null, compressed));
}

class Blueprint {
    static CONN_DECIDER_IN = '1';
    static CONN_DECIDER_OUT = '2';
    static CONN_DEFAULT = '1';

    constructor(string = null) {
        this._root = string ? decode(string) : { blueprint: { entities: [] } };
        this.entities.sort((a, b) =>
            a.position.y != b.position.y ? a.position.y - b.position.y : a.position.x - b.position.x
        );
    }

    get entities() {
        return this._root.blueprint.entities;
    }

    set entities(value) {
        this._root.blueprint.entities = value;
    }

    encode() {
        return encode(this._root);
    }

    get_at(x, y) {
        x = x + 0.5
        y = y + 0.5
        const found = this.entities.filter(entity =>
            Math.abs(entity.position.x - x) <= 0.5 && Math.abs(entity.position.y - y) <= 0.5
        );
        if (found.length > 1)
            throw new Error('Multiple entities found');
        return found[0];
    }

    add_entity(entity) {
        entity.entity_number = 1 + this.entities.length;
        this.entities.push(entity);
        return entity
    }

    add_entities() {
        for (var i = 0; i < arguments.length; i++)
            this.add_entity(arguments[i]);
    }

    add_constant(x, y) {
        return this.add_entity({
            name: 'constant-combinator',
            position: { x: x + 0.5, y: y + 0.5 },
            direction: 2,
        });
    }

    add_requester(x, y) {
        return this.add_entity({
            name: 'logistic-chest-requester',
            position: { x: x + 0.5, y: y + 0.5 }
        });
    }

    add_decider(x, y, f_value) {
        return this.add_entity({
            name: 'decider-combinator',
            position: { x: x + 0.5, y: y + 1 },
            direction: 4,
            control_behavior: {
                decider_conditions: {
                    first_signal: { type: 'virtual', name: 'signal-F' },
                    constant: f_value,
                    comparator: '=',
                    output_signal: { type: 'virtual', name: 'signal-everything' },
                    copy_count_from_input: true,
                },
            },
        });
    }

    _add_item_constant_combinator(entity, name, count) {
        const control_behavior = (entity.control_behavior = entity.control_behavior || {});
        const filters = (control_behavior.filters = control_behavior.filters || []);

        const index = 1 + filters.length;
        if (index > 20)
            throw new Error('index exceeds limit');

        filters.push({
            signal: {
                type: 'item',
                name: name,
            },
            count: count,
            index: index,
        });
    }

    _add_item_chest_requester(entity, name, count) {
        const request_filters = (entity.request_filters = entity.request_filters || []);
        const index = 1 + request_filters.length;

        request_filters.push({
            name: name,
            count: count,
            index: index
        });
    }

    add_item(x, y, name, count) {
        const entity = this.get_at(x, y);

        if (entity.name == 'constant-combinator')
            this._add_item_constant_combinator(entity, name, count);
        else if (entity.name == 'logistic-chest-requester')
            this._add_item_chest_requester(entity, name, count);
        else
            throw new Error('Entity not found or invalid type');
    }

    add_connection(entity1, canal1, entity2, canal2, color) {
        const connection1 = this._get_entity_connections(entity1, canal1, color);
        const connection2 = this._get_entity_connections(entity2, canal2, color);

        connection1.push({
            'entity_id': entity2.entity_number,
            'circuit_id': parseInt(canal2)
        });
        connection2.push({
            'entity_id': entity1.entity_number,
            'circuit_id': parseInt(canal1)
        });
    }

    add_connection_coord(x, y, xy_canal, s, t, st_canal, color) {
        this.add_connection(this.get_at(x, y), xy_canal, this.get_at(s, t), st_canal, color);
    }

    _get_entity_connections(entity, canal, color) {
        if (!entity)
            throw new Error('invalid entity');
        const connections = (entity.connections = entity.connections || {});
        const canalConnections = (connections[canal] = connections[canal] || {});
        const colorConnections = (canalConnections[color] = canalConnections[color] || []);
        return colorConnections;
    }
}
