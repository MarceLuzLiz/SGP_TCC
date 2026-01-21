'use client';

import { useTransition } from 'react';
import {
  createUser,
  suspendUser,
  reactivateUser,
} from '@/lib/actions/admin';
import { Role } from '@prisma/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import React from 'react'; // Para o <form> reset

// O tipo de dado que vem do Server Component
type UserForAdmin = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isSuspended: boolean;
  createdAt: Date;
};

interface UserManagementClientProps {
  users: UserForAdmin[];
}

// --- 1. COMPONENTE PRINCIPAL (LISTA) ---
export function UserManagementClient({ users }: UserManagementClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleSuspend = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja SUSPENDER o usuário ${name}?`)) {
      startTransition(async () => {
        const result = await suspendUser(id);
        if (result.error) toast.error(result.error);
        else toast.success(result.success);
      });
    }
  };

  const handleReactivate = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja REATIVAR o usuário ${name}?`)) {
      startTransition(async () => {
        const result = await reactivateUser(id);
        if (result.error) toast.error(result.error);
        else toast.success(result.success);
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              {user.isSuspended ? (
                <Badge variant="destructive">Suspenso</Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              {/* O Admin não pode suspender a si mesmo */}
              {user.role !== Role.ADMIN && (
                user.isSuspended ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReactivate(user.id, user.name)}
                    disabled={isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Reativar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleSuspend(user.id, user.name)}
                    disabled={isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Suspender
                  </Button>
                )
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// --- 2. SUB-COMPONENTE (FORMULÁRIO DE CRIAÇÃO) ---
export function CreateUserForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        formRef.current?.reset(); // Limpa o formulário
      }
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha Provisória</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Cargo</Label>
        <Select name="role" required defaultValue={Role.FISCAL}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Role.FISCAL}>Fiscal</SelectItem>
            <SelectItem value={Role.ENGENHEIRO}>Engenheiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar Usuário
      </Button>
    </form>
  );
}