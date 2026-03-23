"use client";

import Swal from "sweetalert2";
import { Trash2 } from "lucide-react";

export default function DeleteButton({
  action,
  id,
  disabled,
  title = "Atenção",
  text = "Deseja realmente excluir este registro? Essa ação não pode ser desfeita.",
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  disabled?: boolean;
  title?: string;
  text?: string;
}) {
  const handleDelete = async () => {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#737373",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      background: "var(--background-color, #fff)",
      color: "var(--text-color, #171717)",
    });

    if (result.isConfirmed) {
      const formData = new FormData();
      formData.append("id", id.toString());
      await action(formData);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleDelete}
      className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition p-2"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
