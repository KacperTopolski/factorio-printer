import json
import zlib
import base64

def decode(string):
    return json.loads(zlib.decompress(base64.b64decode(string[1:])).decode('UTF-8'))

def encode(obj):
    return '0' + base64.b64encode(zlib.compress(bytes(json.dumps(obj), 'UTF-8'))).decode('UTF-8')

class Blueprint:
    CONN_DECIDER_IN = '1'
    CONN_DECIDER_OUT = '2'
    CONN_CONSTANT = '1'

    def __init__(self, string=None):
        self._root: dict = decode(string) if string else {'blueprint': {'entities': []}}

    @property
    def entities(self) -> list[dict]:
        return self._root['blueprint']['entities']

    def pr(self) -> None:
        string = encode(self._root)
        print(string)

    def _at(self, x, y) -> dict:
        found = [entity for entity in self.entities if abs(entity['position']['x'] - x) <= 0.5 and abs(entity['position']['y'] - y) <= 0.5]
        assert len(found) == 1
        return found[0]

    def create_constant(self, x, y):
        constant = {
            'entity_number': 1 + len(self.entities),
            'name': 'constant-combinator',
            'position': {'x': x + 0.5, 'y': y + 0.5},
            'direction': 2
        }
        self.entities.append(constant)

    # (x, y) is an upper part of decider
    def create_decider(self, x, y, f_value):
        decider = {
            'entity_number': 1 + len(self.entities),
            'name': 'decider-combinator',
            'position': {'x': x + 0.5, 'y': y + 1},
            'direction': 4,
            'control_behavior': {'decider_conditions': {'first_signal': {'type': 'virtual',
                'name': 'signal-F'},
                'constant': f_value,
                'comparator': '=',
                'output_signal': {'type': 'virtual', 'name': 'signal-everything'},
                'copy_count_from_input': True}}
        }
        self.entities.append(decider)

    def add_item(self, x, y, name, count):
        entity: dict = self._at(x + 0.5, y + 0.5)
        assert entity['name'] == 'constant-combinator'
        filters: list = entity.setdefault('control_behavior', {}).setdefault('filters', [])
        index = 1 + len(filters)
        assert index <= 20

        item = {
            'signal': {
                'type': 'item',
                'name': name
            },
            'count': count,
            'index': index
        }
        filters.append(item)

    def add_connection(self, x, y, xy_canal, s, t, st_canal, color):
        entity_1: dict = self._at(x + 0.5, y + 0.5)
        entity_2: dict = self._at(s + 0.5, t + 0.5)
        connection1: list = entity_1.setdefault('connections', {}).setdefault(xy_canal, {}).setdefault(color, [])
        connection2: list = entity_2.setdefault('connections', {}).setdefault(st_canal, {}).setdefault(color, [])

        connection1.append({'entity_id': entity_2['entity_number'], 'circuit_id': int(st_canal)})
        connection2.append({'entity_id': entity_1['entity_number'], 'circuit_id': int(xy_canal)})
