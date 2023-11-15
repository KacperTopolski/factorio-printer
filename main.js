document.addEventListener('DOMContentLoaded', function () {
    var dropArea = document.getElementById('dropArea');
    var imageInput = document.getElementById('imageInput');
    var outputCanvas = document.getElementById('outputCanvas');
    var ctx = outputCanvas.getContext('2d');

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
        if (file) {
            var reader = new FileReader();

            reader.onload = function (event) {
                var img = new Image();

                img.onload = function () {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
                    ctx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height);

                    // Process the image (add your image processing logic here)
                    // ...
                };

                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        }
    }
});
