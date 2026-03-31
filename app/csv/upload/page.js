"use client";

export default function UploadCSV() {
  const handleUpload = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/csv", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    // console.log(data);
  };

  return (
    <input type="file" accept=".csv" onChange={handleUpload} />
  );
}