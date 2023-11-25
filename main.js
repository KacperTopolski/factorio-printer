function copyToClipboard(text) {
    const invisibleTextArea = document.getElementById('invisibleTextArea');
    invisibleTextArea.value = text;
    invisibleTextArea.select();
    document.execCommand('copy');
}

CACHED_IMAGE_BLUEPRINT = ''
function copyImageBlueprint() {
    if (CACHED_IMAGE_BLUEPRINT.length == 0)
        throw new Error('select image first');
    copyToClipboard(CACHED_IMAGE_BLUEPRINT);
}

function copyPrinterBlueprint() {
    const item_list = get_palette().map(item => item.name);
    const bl = printer_blueprint(PRINTER_STRING, item_list, 45, 48);
    const text = bl.encode();

    copyToClipboard(text);
}

document.addEventListener('DOMContentLoaded', function () {
    const dropArea = document.getElementById('dropArea');
    const imageInput = document.getElementById('imageInput');
    const outputCanvas = document.getElementById('outputCanvas');
    const ctx = outputCanvas.getContext('2d');
    const copyTextarea = document.getElementById('copyTextarea');

    // Handle drag and drop events
    dropArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropArea.style.borderColor = 'orange';
    });

    dropArea.addEventListener('dragleave', function () {
        dropArea.style.borderColor = 'white';
    });

    dropArea.addEventListener('drop', function (e) {
        e.preventDefault();
        dropArea.style.borderColor = 'white';
        handleImage(e.dataTransfer.files[0]);
    });

    // Handle file input change
    imageInput.addEventListener('change', function (e) {
        handleImage(e.target.files[0]);
    });

    // Handle click on dropArea
    dropArea.addEventListener('click', function () {
        imageInput.click();
    });

    function handleImage(file) {
        if (!file)
            return;

        const reader = new FileReader();

        reader.onload = function (event) {
            const img = new Image();

            img.onload = function (event) {
                const result = process_image(img, get_palette(), 4, 32);
                const new_img = new Image();

                new_img.onload = function() {
                    outputCanvas.height = 400 * new_img.height / new_img.width;

                    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                    ctx.drawImage(new_img, 0, 0, outputCanvas.width, outputCanvas.height);
                }

                new_img.src = result.imageURL;

                const bl = blueprint_from_material_list(result.itemData);
                CACHED_IMAGE_BLUEPRINT = bl.encode();
                copyImageBlueprint();
            };
            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    }
});
