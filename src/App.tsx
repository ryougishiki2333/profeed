import { useState, useRef } from "react";

interface TranslationItem {
  key: string;
  original: string;
  translation: string;
}

function App() {
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setError("请选择JSON文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);

        // 转换JSON数据为翻译项目数组
        const items: TranslationItem[] = [];

        const processObject = (obj: any, prefix = "") => {
          for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              processObject(value, fullKey);
            } else if (typeof value === "string") {
              items.push({
                key: fullKey,
                original: value,
                translation: value,
              });
            }
          }
        };

        processObject(jsonData);
        setTranslations(items);
        setFileName(file.name);
        setError("");
        setSuccess(`成功加载 ${items.length} 条翻译项目`);
      } catch (err) {
        setError("JSON文件格式错误，请检查文件内容");
        console.error("Parse error:", err);
      }
    };

    reader.readAsText(file, "utf-8");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("dragover");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const updateTranslation = (index: number, newTranslation: string) => {
    const newTranslations = [...translations];
    newTranslations[index].translation = newTranslation;
    setTranslations(newTranslations);
  };

  const downloadJSON = () => {
    if (translations.length === 0) return;

    // 重建JSON结构
    const result: any = {};

    translations.forEach((item) => {
      const keys = item.key.split(".");
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = item.translation;
    });

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(".json", "_proofread.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccess("文件下载成功！");
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Profeed - 翻译校对工具</h1>
        <p>上传JSON翻译文件，进行校对和编辑，然后下载修改后的文件</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div
        className="upload-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div>
          <p>拖拽JSON文件到此处，或点击选择文件</p>
          <button className="upload-button">选择文件</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInputChange}
          className="file-input"
        />
      </div>

      {translations.length > 0 && (
        <>
          <div className="translation-editor">
            {translations.map((item, index) => (
              <div key={item.key} className="translation-item">
                <div className="translation-key">{item.key}</div>
                <div className="translation-content">
                  <div className="translation-column">
                    <label className="translation-label">原文</label>
                    <textarea
                      className="translation-text"
                      value={item.original}
                      readOnly
                    />
                  </div>
                  <div className="translation-column">
                    <label className="translation-label">译文</label>
                    <textarea
                      className="translation-text"
                      value={item.translation}
                      onChange={(e) => updateTranslation(index, e.target.value)}
                      placeholder="在此编辑翻译..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button
              className="download-button"
              onClick={downloadJSON}
              disabled={translations.length === 0}
            >
              下载校对后的文件
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
