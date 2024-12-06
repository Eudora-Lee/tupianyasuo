document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const downloadBtn = document.getElementById('downloadBtn');
    const compressionControls = document.querySelector('.compression-controls');
    const previewSection = document.querySelector('.preview-section');

    let originalFile = null;

    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => fileInput.click());

    // 处理文件拖放
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 处理文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // 处理质量滑块变化
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        if (originalFile) {
            compressImage(originalFile, e.target.value / 100);
        }
    });

    // 处理文件
    function handleFile(file) {
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (!supportedTypes.includes(file.type)) {
            alert('请选择 PNG、JPG、JPEG 或 WebP 格式的图片！');
            return;
        }

        originalFile = file;
        compressionControls.style.display = 'block';
        previewSection.style.display = 'block';

        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            originalSize.textContent = `文件大小：${formatFileSize(file.size)}`;
            compressImage(file, qualitySlider.value / 100);
        };
        reader.readAsDataURL(file);
    }

    // 压缩图片
    function compressImage(file, quality) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // 计算压缩后的尺寸
                let width = img.width;
                let height = img.height;
                
                // 如果图片尺寸过大，等比例缩小
                const MAX_WIDTH = 2048;
                const MAX_HEIGHT = 2048;
                
                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                    width *= ratio;
                    height *= ratio;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                
                // 使用更好的图像平滑算法
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // 清空画布
                ctx.clearRect(0, 0, width, height);
                
                // 绘制图像
                ctx.drawImage(img, 0, 0, width, height);

                // 根据文件类型选择适当的压缩参数
                let compressionQuality = quality;
                let outputType = file.type;

                // 对PNG格式特殊处理
                if (file.type === 'image/png') {
                    // PNG使用无损压缩，quality参数影响色彩深度
                    compressionQuality = Math.max(0.5, quality); // 最低保持0.5的质量
                    outputType = quality < 0.8 ? 'image/jpeg' : 'image/png'; // 质量太低时转换为JPEG
                }

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            alert('压缩失败，请尝试其他图片');
                            return;
                        }

                        compressedPreview.src = URL.createObjectURL(blob);
                        compressedSize.textContent = `文件大小：${formatFileSize(blob.size)}`;
                        
                        // 如果压缩后比原图还大，使用原图
                        if (blob.size > file.size) {
                            compressedPreview.src = originalPreview.src;
                            compressedSize.textContent = `文件大小：${formatFileSize(file.size)} (使用原图)`;
                            blob = file;
                        }

                        // 设置下载按钮
                        downloadBtn.onclick = () => {
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            // 添加适当的文件扩展名
                            const extension = outputType.split('/')[1];
                            link.download = `compressed_${file.name.split('.')[0]}.${extension}`;
                            link.click();
                        };
                    },
                    outputType,
                    compressionQuality
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 