document.addEventListener('DOMContentLoaded', function () {
    // Get the input element and canvas
    var imageInput = document.getElementById('imageInput');
    var outputCanvas = document.getElementById('outputCanvas');
    var ctx = outputCanvas.getContext('2d');

    // Add event listener to handle image selection
    imageInput.addEventListener('change', handleImage);

    function handleImage(e) {
        var file = e.target.files[0];

        if (file) {
            // Read the selected image file
            var reader = new FileReader();

            reader.onload = function (event) {
                // Create an image element
                var img = new Image();

                img.onload = function () {
                    // Draw the image on the canvas
                    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                    ctx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height);

                    // Process the image (add your image processing logic here)

                    // Example: Convert image to grayscale
                    // You can replace this with your own image processing code
                    var imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
                    var data = imageData.data;

                    for (var i = 0; i < data.length; i += 4) {
                        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = avg;
                        data[i + 1] = avg;
                        data[i + 2] = avg;
                    }

                    ctx.putImageData(imageData, 0, 0);
                };

                // Set the source of the image to the data URL
                img.src = event.target.result;
            };

            // Read the image file as a data URL
            reader.readAsDataURL(file);
        }
    }
});
