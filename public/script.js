document.getElementById('imageInput').addEventListener('change', function () {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    const file = this.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.borderRadius = '8px';
            img.style.border = '1px solid #00ffff44';
            img.style.boxShadow = '0 0 5px #00ffff22';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const number = document.getElementById('numberInput').value.trim();
    const image = document.getElementById('imageInput').files[0];
    const resultBox = document.getElementById('result');

    if (!number || !image) {
        resultBox.innerHTML = `<span style="color: red;">Please provide both number and image</span>`;
        return;
    }

    resultBox.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('image', image);

    try {
        // Step 1: Upload image
        const uploadRes = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const uploadData = await uploadRes.json();
        console.log('Upload response:', uploadData);

        if (!uploadData.message || !uploadData.filename) {
            resultBox.innerHTML = `<span style="color: red;">Image upload failed!</span>`;
            return;
        }

        // Step 2: Get code
        resultBox.textContent = 'Generating code...';

        const codeRes = await fetch(`/connect?phoneNumber=${number}&filename=${encodeURIComponent(uploadData.filename)}`);
        const codeData = await codeRes.json();
        console.log('Code response:', codeData);

        if (codeData.code) {
            resultBox.innerHTML = `<span style="color: blue;">📱 Pairing Code: <strong>${codeData.code}</strong></span>`;
        } else {
            resultBox.innerHTML = `<span style="color: red;">Failed to generate code</span>`;
        }

    } catch (err) {
        console.error(err);
        resultBox.innerHTML = `<span style="color: red;">Something went wrong. Try again.</span>`;
    }
});


window.onload = () => {
    const modal = document.getElementById('infoModal');

    const shown = sessionStorage.getItem('infoModalShown');

    if (!shown) {
        setTimeout(() => {
            modal.style.display = 'flex'; // Show modal
        }, 3000);
    }
};

function closeModal() {
    const modal = document.getElementById('infoModal');
    modal.style.display = 'none';
    sessionStorage.setItem('infoModalShown', 'true');
}

function openModal() {
    document.getElementById('infoModal').style.display = 'flex';
  }
  
  
  window.addEventListener('click', function (e) {
    const modal = document.getElementById('infoModal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  