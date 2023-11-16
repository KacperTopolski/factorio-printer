function copyTextareaToClipboard() {
    const copyTextarea = document.getElementById('copyTextarea');

    copyTextarea.select();
    copyTextarea.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand('copy');
}

function copyImageBlueprint() {
    copyTextareaToClipboard();
}

function copyChestBlueprint() {
    const copyTextarea = document.getElementById('copyTextarea');

    const itemList = get_palette().map(item => item.name);
    const bl = blueprint_of_chests_requesters(itemList, 50);
    copyTextarea.value = bl.encode();

    copyTextareaToClipboard();
}

function copyPrinterBlueprint() {
    throw new Error("not implemented");
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
                const result = process_image(img, get_palette());
                const new_img = new Image();

                new_img.onload = function() {
                    outputCanvas.height = 400 * new_img.height / new_img.width;

                    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                    ctx.drawImage(new_img, 0, 0, outputCanvas.width, outputCanvas.height);
                }

                new_img.src = result.imageURL;

                const bl = blueprint_from_material_list(result.itemData);
                copyTextarea.value = bl.encode();
            };
            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    }
});
