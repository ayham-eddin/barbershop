import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import api from "../../api/client";
import Modal from "../../components/Modal";
import AdminServicesTable, {
  type Service,
} from "../../components/admin/AdminServicesTable";
import { extractErrorMessage } from "../../utils/httpErrors";
import AdminPageLayout from "../../components/admin/AdminPageLayout";
import PageHeader from "../../components/admin/PageHeader";
import FormGrid from "../../components/ui/FormGrid";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ModalFooter from "../../components/admin/modals/ModalFooter";

type AdminListResponse = { services: Service[] };

const AdminServicesPage = () => {
  const qc = useQueryClient();

  // ---- load list ----
  const { data, isLoading, isError, refetch } = useQuery<AdminListResponse>({
    queryKey: ["adminServices"],
    queryFn: async () => {
      const res = await api.get("/api/admin/services");
      return res.data as AdminListResponse;
    },
    staleTime: 5_000,
  });

  const services = useMemo<Service[]>(() => data?.services ?? [], [data]);

  // ---- create form state ----
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState<number>(30);
  const [price, setPrice] = useState<number>(10);

  // ---- edit modal state ----
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDurationMin, setEditDurationMin] = useState<number>(30);
  const [editPrice, setEditPrice] = useState<number>(10);

  const openEdit = (s: Service) => {
    setEditId(s._id);
    setEditName(s.name);
    setEditDurationMin(s.durationMin);
    setEditPrice(s.price);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditId(null);
  };

  // ---- mutations ----
  const createMut = useMutation({
    mutationFn: async (payload: {
      name: string;
      durationMin: number;
      price: number;
    }) => {
      const res = await api.post("/api/admin/services", payload);
      return res.data as { service: Service };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminServices"] }).catch(() => {});
      setName("");
      setDurationMin(30);
      setPrice(10);
      toast.success("Service created.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: {
      id: string;
      patch: Partial<Pick<Service, "name" | "durationMin" | "price">>;
    }) => {
      const res = await api.patch(
        `/api/admin/services/${payload.id}`,
        payload.patch,
      );
      return res.data as { service: Service };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminServices"] }).catch(() => {});
      toast.success("Service updated.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/admin/services/${id}`);
      return res.data as { deleted: Service };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminServices"] }).catch(() => {});
      toast.success("Service deleted.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const onSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required.");
    if (durationMin <= 0 || durationMin > 480) {
      return toast.error("Duration must be 1–480 minutes.");
    }
    if (price < 0) return toast.error("Price must be ≥ 0.");
    createMut.mutate({ name: name.trim(), durationMin, price });
  };

  const onSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    if (!editName.trim()) return toast.error("Name is required.");
    if (editDurationMin <= 0 || editDurationMin > 480) {
      return toast.error("Duration must be 1–480 minutes.");
    }
    if (editPrice < 0) return toast.error("Price must be ≥ 0.");

    updateMut.mutate(
      {
        id: editId,
        patch: {
          name: editName.trim(),
          durationMin: editDurationMin,
          price: editPrice,
        },
      },
      {
        onSuccess: () => {
          closeEdit();
        },
      },
    );
  };

  return (
    <AdminPageLayout>
      <PageHeader
        title="Manage Services"
        onRefresh={() => refetch()}
        loading={isLoading}
      />

      {/* Create form using shared UI components */}
      <form onSubmit={onSubmitCreate}>
        <FormGrid columns={4}>
          <Input
            placeholder="Service name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            type="number"
            min={5}
            max={480}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            placeholder="Duration (min)"
            required
          />

          <Input
            type="number"
            min={0}
            step={0.5}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="Price (€)"
            required
          />

          <Button type="submit" loading={createMut.isPending}>
            Add Service
          </Button>
        </FormGrid>
      </form>

      {/* Table / states */}
      <AdminServicesTable
        services={services}
        isLoading={isLoading}
        isError={isError}
        onEdit={openEdit}
        onBumpPrice={(s) =>
          updateMut.mutate({
            id: s._id,
            patch: { price: Math.max(0, s.price + 1) },
          })
        }
        onDelete={(id) => deleteMut.mutate(id)}
        isUpdating={updateMut.isPending}
        isDeleting={deleteMut.isPending}
      />

      {/* Edit modal */}
      <Modal
        open={editOpen}
        title="Edit service"
        onClose={closeEdit}
        footer={
          <ModalFooter
            onCancel={closeEdit}
            submitting={updateMut.isPending}
            submitLabel="Save changes"
            formId="edit-service-form"
          />
        }
      >
        <form
          id="edit-service-form"
          onSubmit={onSubmitEdit}
          className="space-y-3"
        >
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <Input
            label="Duration (min)"
            type="number"
            min={5}
            max={480}
            value={editDurationMin}
            onChange={(e) => setEditDurationMin(Number(e.target.value))}
            required
          />

          <Input
            label="Price (€)"
            type="number"
            min={0}
            step={0.5}
            value={editPrice}
            onChange={(e) => setEditPrice(Number(e.target.value))}
            required
          />
        </form>
      </Modal>
    </AdminPageLayout>
  );
};

export default AdminServicesPage;
