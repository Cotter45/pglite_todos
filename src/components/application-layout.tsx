import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  EllipsisHorizontalIcon,
  HomeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useLiveQuery, usePGlite } from "@electric-sql/pglite-react";

import { Input } from "./input";
import { Button } from "./button";
import { Avatar } from "@/components/avatar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { Dialog, DialogActions, DialogBody, DialogTitle } from "./dialog";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "@/components/sidebar";
import { Field, Label } from "./fieldset";
import { PhotoUploader } from "./avatar-upload";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "./dropdown";
import { Text } from "./text";

export type List = {
  id: number;
  name: string;
  avatar: string;
};

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const db = usePGlite();
  const [params] = useSearchParams();
  const lists = useLiveQuery<List>("SELECT * FROM lists", []);

  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(0);
  const [deleteId, setDeleteId] = useState(0);
  const [avatar, setAvatar] = useState("");

  const listId = params.get("listId");

  const createList = async () => {
    if (!name) return;

    if (avatar) {
      await db.query("INSERT INTO lists (name, avatar) VALUES ($1, $2)", [
        name,
        avatar,
      ]);
    } else {
      await db.query("INSERT INTO lists (name) VALUES ($1)", [name]);
    }

    setName("");
    setAvatar("");
  };

  const editList = async (id: number) => {
    if (!name) return;

    if (avatar) {
      await db.query("UPDATE lists SET name = $1, avatar = $2 WHERE id = $3", [
        name,
        avatar,
        id,
      ]);
    } else {
      await db.query("UPDATE lists SET name = $1 WHERE id = $2", [name, id]);
    }

    setName("");
    setAvatar("");
    setEditId(0);
  };

  const deleteList = async (id: number) => {
    await db.query("DELETE FROM lists WHERE id = $1", [id]);
    setDeleteId(0);
  };

  return (
    <SidebarLayout
      navbar={null}
      sidebar={
        <Sidebar>
          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/" current={!listId}>
                <HomeIcon className="h-4 w-4" />
                <span>All Todos</span>
              </SidebarItem>
              {lists &&
                lists.rows.map(({ id, name, avatar }) => (
                  <SidebarItem
                    key={id}
                    href={`/?listId=${id}`}
                    current={Number(listId) === id}
                  >
                    <Avatar
                      src={avatar ?? "/favicon.svg"}
                      className="w-6 h-6"
                    />
                    <SidebarLabel className="w-full flex items-center justify-between">
                      <Text>{name}</Text>

                      <Dropdown>
                        <DropdownButton plain className="p-2">
                          <EllipsisHorizontalIcon className="w-5 h-5" />
                        </DropdownButton>

                        <DropdownMenu>
                          <DropdownItem
                            onClick={() => {
                              setEditId(id);
                              setName(name);
                            }}
                          >
                            <PencilIcon className="w-5 h-5" />
                            <span>Edit</span>
                          </DropdownItem>

                          <DropdownItem onClick={() => setDeleteId(id)}>
                            <TrashIcon className="w-5 h-5" />
                            <span>Delete</span>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </SidebarLabel>
                  </SidebarItem>
                ))}
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter>
            <SidebarItem
              onClick={() => {
                setOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              <span>New List</span>
            </SidebarItem>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New List</DialogTitle>
        <DialogBody>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createList();
              setOpen(false);
            }}
            className="space-y-4"
          >
            <Field>
              <PhotoUploader setImageBase64={setAvatar} />
            </Field>

            <Field>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
                className="w-full mb-8"
              />
            </Field>

            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button color="emerald" onClick={createList}>
                Create
              </Button>
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>

      <Dialog open={editId > 0} onClose={() => setEditId(0)}>
        <DialogTitle>Edit List</DialogTitle>
        <DialogBody>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await editList(editId);
              setEditId(0);
            }}
            className="space-y-4"
          >
            <Field>
              <PhotoUploader setImageBase64={setAvatar} />
            </Field>

            <Field>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
                className="w-full mb-8"
              />
            </Field>

            <DialogActions>
              <Button onClick={() => setEditId(0)}>Cancel</Button>
              <Button color="emerald" onClick={() => editList(editId)}>
                Save
              </Button>
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>

      <Dialog open={deleteId > 0} onClose={() => setDeleteId(0)}>
        <DialogTitle>Delete List</DialogTitle>
        <DialogBody>
          <p>Are you sure you want to delete this list?</p>
        </DialogBody>
        <DialogActions>
          <Button onClick={() => setDeleteId(0)}>Cancel</Button>
          <Button color="rose" onClick={() => deleteList(deleteId)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </SidebarLayout>
  );
}
