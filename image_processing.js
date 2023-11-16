function color_dist(c1, c2) {
    return (c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2;
}

function get_palette() {
    return [
        {r: 134, g: 134, b: 134, name: "iron-plate"},
        {r: 179, g: 110, b: 87, name: "copper-plate"},
        {r: 155, g: 85, b: 54, name: "copper-ore"},
        {r: 180, g: 113, b: 88, name: "copper-cable"},
        {r: 197, g: 197, b: 197, name: "plastic-bar"},
        {r: 97, g: 81, b: 71, name: "assembling-machine-1"},
        {r: 75, g: 74, b: 86, name: "assembling-machine-2"},
        {r: 87, g: 91, b: 61, name: "assembling-machine-3"},
        {r: 44, g: 40, b: 36, name: "coal"},
        {r: 118, g: 121, b: 122, name: "concrete"},
        {r: 87, g: 121, b: 68, name: "effectivity-module"},
        {r: 95, g: 136, b: 39, name: "electronic-circuit"},
        {r: 169, g: 67, b: 41, name: "advanced-circuit"},
        {r: 85, g: 104, b: 164, name: "processing-unit"},
        {r: 132, g: 73, b: 64, name: "explosives"},
        {r: 111, g: 109, b: 89, name: "hazard-concrete"},
        {r: 108, g: 92, b: 77, name: "iron-chest"},
        {r: 80, g: 102, b: 113, name: "iron-ore"},
        {r: 133, g: 124, b: 57, name: "landfill"},
        {r: 136, g: 89, b: 61, name: "productivity-module"},
        {r: 158, g: 154, b: 152, name: "small-lamp"},
        {r: 74, g: 74, b: 74, name: "solid-fuel"},
        {r: 166, g: 152, b: 28, name: "sulfur"},
        {r: 72, g: 112, b: 127, name: "speed-module"},
        {r: 121, g: 102, b: 68, name: "stone"},
        {r: 117, g: 118, b: 114, name: "steel-plate"},
        {r: 119, g: 103, b: 101, name: "steel-chest"},
        {r: 111, g: 112, b: 107, name: "stone-brick"},
        {r: 130, g: 98, b: 46, name: "wooden-chest"},
        {r: 104, g: 88, b: 63, name: "underground-belt"},
        {r: 93, g: 69, b: 93, name: "logistic-chest-active-provider"},
        {r: 113, g: 71, b: 59, name: "logistic-chest-passive-provider"},
        {r: 73, g: 105, b: 69, name: "logistic-chest-buffer"},
        {r: 77, g: 96, b: 96, name: "logistic-chest-requester"},
        {r: 109, g: 97, b: 54, name: "logistic-chest-storage"}
    ];
}

function process_image(image, palette, W_ROUND = 4, H = 32) {
    const W = Math.round((H * image.width) / (image.height * W_ROUND)) * W_ROUND

    const offscreen_canvas = document.createElement('canvas');
    offscreen_canvas.width = W;
    offscreen_canvas.height = H;
    const context = offscreen_canvas.getContext('2d');

    context.clearRect(0, 0, W, H);
    context.drawImage(image, 0, 0, W, H);

    const imageData = context.getImageData(0, 0, W, H);
    const itemData = Array.from({length: W}, _ => new Array(H));

    if (imageData.data.length != 4 * W * H)
        throw new Error('this is weird, data.length is ' + data.length);

    for (let i = 0; i < imageData.data.length; i += 4) {
        const pixel = {r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2]};
        const x = i / 4 % W;
        const y = Math.floor(i / 4 / W);

        const best = palette.reduce((best, current) =>
            color_dist(pixel, best) < color_dist(pixel, current) ? best : current
        );

        imageData.data[i] = best.r;
        imageData.data[i + 1] = best.g;
        imageData.data[i + 2] = best.b;
        imageData.data[i + 3] = 255;

        itemData[x][y] = best.name;
    }

    context.putImageData(imageData, 0, 0);

    return {imageURL: offscreen_canvas.toDataURL(), itemData: itemData};
}

function blueprint_of_chests_requesters(itemList, count, cnt=2) {
    const bl = new Blueprint();
    for (let i = 0; i < cnt; ++i)
        bl.add_requester(i * 4, 0);

    for (let i = 0; i < itemList.length; ++i)
        bl.add_item((i % cnt) * 4, 0, itemList[i], count);

    return bl;
}

function blueprint_from_material_list(itemData) {
    const W = itemData.length

    if (W % 4 != 0 || W == 0 || itemData[0].length != 32)
        throw new Error('bad dimensions');

    const bl = new Blueprint();

    for (let x = 0; x < W; ++x) {
        const X = Math.floor(x / 4);
        const C = [0 + 4 * (x % 4), 1 + 4 * (x % 4)];
        const D = 2 + 4 * (x % 4);

        bl.add_constant(X, C[0]);
        bl.add_constant(X, C[1]);
        bl.add_decider (X, D, f_value=X+1);

        if (X-1 >= 0) {
            bl.add_connection(X, D, Blueprint.CONN_DECIDER_OUT, X-1, D, Blueprint.CONN_DECIDER_OUT, 'red');
            bl.add_connection(X, D, Blueprint.CONN_DECIDER_IN, X-1, D, Blueprint.CONN_DECIDER_IN, 'green');
        }
        if (D-4 >= 0)
            bl.add_connection(X, D, Blueprint.CONN_DECIDER_IN, X, D-4, Blueprint.CONN_DECIDER_IN, 'green');

        bl.add_connection(X, C[0], Blueprint.CONN_DEFAULT, X, C[1], Blueprint.CONN_DEFAULT, 'red');
        bl.add_connection(X, C[1], Blueprint.CONN_DEFAULT, X, D, Blueprint.CONN_DECIDER_IN, 'red');

        for (let y = 0; y < 32; ++y)
            bl.add_item(X, C[y % 2], itemData[x][y], 1 << y);
    }

    bl.add_entity({
        'name': 'decider-combinator',
        'position': {'x': -1, 'y': 2.5},
        'direction': 2,
        'control_behavior': {
            'decider_conditions': {
                'first_signal': {'type': 'virtual', 'name': 'signal-R'},
                'constant': 1,
                'comparator': '=',
                'output_signal': {'type': 'virtual', 'name': 'signal-F'},
                'copy_count_from_input': true
            }
        }
    });
    bl.add_entity({
        'name': 'constant-combinator',
        'position': {'x': -0.5, 'y': 1.5},
        'direction': 2,
        'control_behavior': {
            'filters': [{
                'signal': {'type': 'virtual', 'name': 'signal-F'},
                'count': 1,
                'index': 1
            }]
        }
    });
    bl.add_entity({
        'name': 'decider-combinator',
        'position': {'x': -1, 'y': 4.5},
        'direction': 2,
        'control_behavior': {
            'decider_conditions': {
                'first_signal': {'type': 'virtual', 'name': 'signal-R'},
                'constant': 1,
                'comparator': '=',
                'output_signal': {'type': 'virtual', 'name': 'signal-F'},
                'copy_count_from_input': false
            }
        }
    });
    bl.add_entity({
        'name': 'decider-combinator',
        'position': {'x': -1, 'y': 3.5},
        'direction': 2,
        'control_behavior': {
            'decider_conditions': {
                'first_signal': {'type': 'virtual', 'name': 'signal-F'},
                'constant': W / 4,
                'comparator': '<',
                'output_signal': {'type': 'virtual', 'name': 'signal-F'},
                'copy_count_from_input': true
            }
        }
    });
    bl.add_entity({
        'name': 'steel-chest',
        'position': {'x': -2.5, 'y': 6.5}
    });
    bl.add_entity({
        'name': 'steel-chest',
        'position': {'x': -2.5, 'y': 9.5}
    });
    bl.add_entity({
        'name': 'steel-chest',
        'position': {'x': -2.5, 'y': 11.5}
    });
    bl.add_entity({
        'name': 'steel-chest',
        'position': {'x': -2.5, 'y': 13.5}
    });
    bl.add_entity({
        'name': 'steel-chest',
        'position': {'x': -2.5, 'y': 15.5}
    });

    // main control
    bl.add_connection(-3, 6, Blueprint.CONN_DEFAULT, -1, 4, Blueprint.CONN_DECIDER_IN, 'red');
    bl.add_connection(-1, 4, Blueprint.CONN_DECIDER_IN, -1, 3, Blueprint.CONN_DECIDER_IN, 'red');
    bl.add_connection(-1, 3, Blueprint.CONN_DECIDER_IN, -1, 2, Blueprint.CONN_DECIDER_IN, 'red');
    bl.add_connection(-1, 2, Blueprint.CONN_DECIDER_OUT, 0, 2, Blueprint.CONN_DECIDER_IN, 'green');

    // self connections and some constant
    bl.add_connection(-1, 2, Blueprint.CONN_DECIDER_IN, -1, 1, Blueprint.CONN_DEFAULT, 'green');
    bl.add_connection(-1, 3, Blueprint.CONN_DECIDER_IN, -1, 3, Blueprint.CONN_DECIDER_OUT, 'red');
    bl.add_connection(-1, 4, Blueprint.CONN_DECIDER_IN, -1, 4, Blueprint.CONN_DECIDER_OUT, 'red');

    // chests
    bl.add_connection(-3, 9, Blueprint.CONN_DEFAULT, 0, 2, Blueprint.CONN_DECIDER_OUT, 'red');
    bl.add_connection(-3, 11, Blueprint.CONN_DEFAULT, 0, 6, Blueprint.CONN_DECIDER_OUT, 'red');
    bl.add_connection(-3, 13, Blueprint.CONN_DEFAULT, 0, 10, Blueprint.CONN_DECIDER_OUT, 'red');
    bl.add_connection(-3, 15, Blueprint.CONN_DEFAULT, 0, 14, Blueprint.CONN_DECIDER_OUT, 'red');

    return bl;
}
