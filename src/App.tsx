import { useState, useRef } from "react";

// 定义 AinieeCacheData 数据结构的接口
interface AinieeCacheData {
  project_id: string;
  project_type: string;
  project_name?: string;
  detected_encoding?: string;
  detected_line_ending?: string;
  stats_data?: {
    total_line: number;
    line: number;
    untranslated_line: number;
    translated_line: number;
    polished_line: number;
  };
  files: {
    [filePath: string]: {
      storage_path: string;
      file_project_type?: string;
      extra?: {
        subtitle_title?: string;
        top_text?: string;
        [key: string]: any;
      };
      items: Array<{
        text_index: number;
        source_text: string;
        translated_text: string;
        polished_text?: string;
        translation_status: 0 | 1 | 2; // 0=未翻译, 1=已翻译, 2=已润色
        text_classification?: number;
        extra?: {
          language_mismatch_translation?: boolean;
          language_mismatch_polish?: boolean;
          [key: string]: any;
        };
      }>;
    };
  };
}

interface TranslationItem {
  file_path: string;
  text_index: number;
  source_text: string;
  translated_text: string;
  polished_text: string;
  translation_status: 0 | 1 | 2;
}

function App() {
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [projectInfo, setProjectInfo] = useState<{
    project_name?: string;
    project_type: string;
    stats_data?: any;
  } | null>(null);
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
        const jsonData: AinieeCacheData = JSON.parse(content);
        console.log(
          "Parsed JSON data:",
          jsonData,
          jsonData.project_id,
          jsonData.files,
          jsonData.project_type
        );

        // 验证基本结构
        if (!jsonData.project_type || !jsonData.files) {
          setError("文件格式不正确，请检查是否为有效的AinieeCacheData格式");
          return;
        }

        // 转换数据为翻译项目数组
        const items: TranslationItem[] = [];

        Object.entries(jsonData.files).forEach(([filePath, fileData]) => {
          fileData.items.forEach((item) => {
            items.push({
              file_path: filePath,
              text_index: item.text_index,
              source_text: item.source_text,
              translated_text: item.translated_text,
              polished_text: item.polished_text || "",
              translation_status: item.translation_status,
            });
          });
        });

        setTranslations(items);
        setProjectInfo({
          project_name: jsonData.project_name,
          project_type: jsonData.project_type,
          stats_data: jsonData.stats_data,
        });
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

  const updateTranslation = (
    index: number,
    field: "translated_text" | "polished_text",
    newValue: string
  ) => {
    const newTranslations = [...translations];
    newTranslations[index] = {
      ...newTranslations[index],
      [field]: newValue,
    };
    setTranslations(newTranslations);
  };

  const downloadJSON = () => {
    if (translations.length === 0) return;

    // 重建AinieeCacheData结构
    const result: Partial<AinieeCacheData> = {
      project_id: projectInfo?.project_name || "unknown",
      project_type: projectInfo?.project_type || "unknown",
      project_name: projectInfo?.project_name,
      files: {},
    };

    // 按文件路径分组翻译项目
    const fileGroups: { [filePath: string]: TranslationItem[] } = {};
    translations.forEach((item) => {
      if (!fileGroups[item.file_path]) {
        fileGroups[item.file_path] = [];
      }
      fileGroups[item.file_path].push(item);
    });

    // 重建文件结构
    Object.entries(fileGroups).forEach(([filePath, items]) => {
      result.files![filePath] = {
        storage_path: filePath,
        items: items.map((item) => ({
          text_index: item.text_index,
          source_text: item.source_text,
          translated_text: item.translated_text,
          polished_text: item.polished_text || "",
          translation_status: item.translation_status,
        })),
      };
    });

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(".json", "_edited.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccess("文件下载成功！");
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Profeed - AinieeCacheData 翻译校对工具</h1>
        <p>
          上传AinieeCacheData格式的JSON翻译文件，进行校对和编辑，然后下载修改后的文件
        </p>
        {projectInfo && (
          <div className="project-info">
            <p>
              <strong>项目：</strong>
              {projectInfo.project_name || "未命名"}
            </p>
            <p>
              <strong>类型：</strong>
              {projectInfo.project_type}
            </p>
            {projectInfo.stats_data && (
              <p>
                <strong>统计：</strong>总行数{" "}
                {projectInfo.stats_data.total_line}，已翻译{" "}
                {projectInfo.stats_data.translated_line}，已润色{" "}
                {projectInfo.stats_data.polished_line}
              </p>
            )}
          </div>
        )}
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
          <p>拖拽AinieeCacheData JSON文件到此处，或点击选择文件</p>
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
              <div
                key={`${item.file_path}-${item.text_index}`}
                className="translation-item"
              >
                <div className="translation-key">
                  <span className="file-path">{item.file_path}</span>
                  <span className="text-index">#{item.text_index}</span>
                  <span className={`status status-${item.translation_status}`}>
                    {item.translation_status === 0
                      ? "未翻译"
                      : item.translation_status === 1
                      ? "已翻译"
                      : "已润色"}
                  </span>
                </div>
                <div className="translation-content">
                  <div className="translation-column">
                    <label className="translation-label">原文</label>
                    <textarea
                      className="translation-text"
                      value={item.source_text}
                      readOnly
                    />
                  </div>
                  <div className="translation-column">
                    <label className="translation-label">译文</label>
                    <textarea
                      className="translation-text"
                      value={item.translated_text}
                      onChange={(e) =>
                        updateTranslation(
                          index,
                          "translated_text",
                          e.target.value
                        )
                      }
                      placeholder="在此编辑翻译..."
                    />
                  </div>
                  <div className="translation-column">
                    <label className="translation-label">润色文</label>
                    <textarea
                      className="translation-text"
                      value={item.polished_text}
                      onChange={(e) =>
                        updateTranslation(
                          index,
                          "polished_text",
                          e.target.value
                        )
                      }
                      placeholder="在此编辑润色..."
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
