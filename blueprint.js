function decode(string) {
    throw new Error('not implemented');
    return JSON.parse(pako.inflate(atob(string.slice(1)), { to: 'string' }));
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
    }

    get entities() {
        return this._root.blueprint.entities;
    }

    encode() {
        return encode(this._root);
    }

    _get_at(x, y) {
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
    }

    add_constant(x, y) {
        this.add_entity({
            name: 'constant-combinator',
            position: { x: x + 0.5, y: y + 0.5 },
            direction: 2,
        });
    }

    add_requester(x, y) {
        this.add_entity({
            name: 'logistic-chest-requester',
            position: { x: x + 0.5, y: y + 0.5 }
        });
    }

    add_decider(x, y, f_value) {
        this.add_entity({
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
        const entity = this._get_at(x + 0.5, y + 0.5);

        if (entity.name == 'constant-combinator')
            this._add_item_constant_combinator(entity, name, count);
        else if (entity.name == 'logistic-chest-requester')
            this._add_item_chest_requester(entity, name, count);
        else
            throw new Error('Entity not found or invalid type');
    }

    add_connection(x, y, xy_canal, s, t, st_canal, color) {
        const entity1 = this._get_at(x + 0.5, y + 0.5);
        const entity2 = this._get_at(s + 0.5, t + 0.5);

        if (!entity1 || !entity2)
            throw new Error('Entity not found');

        const connection1 = this._get_entity_connections(entity1, xy_canal, color);
        const connection2 = this._get_entity_connections(entity2, st_canal, color);

        connection1.push({
            entity_id: entity2.entity_number,
            circuit_id: parseInt(st_canal)
        });
        connection2.push({
            entity_id: entity1.entity_number,
            circuit_id: parseInt(xy_canal)
        });
    }

    _get_entity_connections(entity, canal, color) {
        const connections = (entity.connections = entity.connections || {});
        const canalConnections = (connections[canal] = connections[canal] || {});
        const colorConnections = (canalConnections[color] = canalConnections[color] || []);
        return colorConnections;
    }
}
