/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery, usePGlite } from "@electric-sql/pglite-react";
import { Field, Label } from "@/components/fieldset";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Empty } from "@/components/empty";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "@/components/dialog";
import {
  CheckIcon,
  EllipsisHorizontalIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { Select } from "@/components/select";
import { Heading, Subheading } from "@/components/heading";
import { AnimatePresence, motion } from "framer-motion";
import { List } from "@/components/application-layout";
import { useSearchParams } from "react-router-dom";
import { Text } from "@/components/text";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "@/components/dropdown";
import { Checkbox } from "@/components/checkbox";
import clsx from "clsx";
import { Badge } from "@/components/badge";

export type Todo = {
  id: number;
  text: string;
  status: "todo" | "done";
  list_id: number;
};

const listVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Stagger the list items
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0, z: 0 },
  visible: { opacity: 1, z: 10 },
};

function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function NoTodos() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div role="status">
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-emerald-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export function Home() {
  const db = usePGlite();
  const [params] = useSearchParams();
  const lists = useLiveQuery<List>("SELECT * FROM lists", []);
  const allTodos = useLiveQuery<Todo>("SELECT * FROM todos", []);

  const [todo, setTodo] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [listId, setListId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [todos, setTodos] = useState<Todo[] | undefined>(undefined);
  const [action, setAction] = useState<"filter" | "search" | undefined>();

  const debouncedSearch = useDebounce(search, 300);
  const paramListId = useMemo(() => Number(params.get("listId")), [params]);

  const insertTodo = async () => {
    if (!todo) return;

    if (listId) {
      await db.query("INSERT INTO todos (text, list_id) VALUES ($1, $2)", [
        todo,
        listId,
      ]);
    } else {
      db.query("INSERT INTO todos (text) VALUES ($1)", [todo]);
    }

    setTodo("");
    setListId(null);
    setOpen(false);
  };

  async function searchTodos(query: string) {
    if (query.endsWith(" ")) return [];

    // Convert the search query into a tsquery format
    const searchQuery = query
      .split(" ")
      .map((term) => `${term}:*`)
      .join(" & "); // Each word is followed by ':*' to allow prefix search

    if (paramListId) {
      // Query the database for matching todos
      const results = await db.query<Todo>(
        `
      SELECT id, text, status
      FROM todos
      WHERE list_id = $1 AND search_vector @@ to_tsquery('english', $2)
    `,
        [paramListId, searchQuery]
      );

      return results.rows; // Return the matching rows
    }

    // Query the database for matching todos
    const results = await db.query<Todo>(
      `
    SELECT id, text, status
    FROM todos
    WHERE search_vector @@ to_tsquery('english', $1)
  `,
      [searchQuery]
    );

    return results.rows; // Return the matching rows
  }

  const updateTodo = async (id: number, text: string) => {
    if (listId) {
      db.query("UPDATE todos SET text = $1, list_id = $2 WHERE id = $3", [
        text,
        listId,
        id,
      ]);
    } else {
      db.query("UPDATE todos SET text = $1 WHERE id = $2", [text, id]);
    }

    setTodo("");
    setListId(null);
    setEditId(null);
  };

  const setStatusDone = async (id: number) => {
    db.query("UPDATE todos SET status = 'done' WHERE id = $1", [id]);

    setTodo("");
    setListId(null);
    setEditId(null);
  };

  const setStatusTodo = async (id: number) => {
    db.query("UPDATE todos SET status = 'todo' WHERE id = $1", [id]);

    setTodo("");
    setListId(null);
    setEditId(null);
  };

  const deleteTodo = async (id: number) => {
    db.query("DELETE FROM todos WHERE id = $1", [id]);

    setTodo("");
    setListId(null);
    setDeleteId(null);
  };

  useEffect(() => {
    if (!allTodos) return;

    if (paramListId) {
      setListId(paramListId);

      const filteredTodos = allTodos?.rows.filter(
        (todo) => Number(todo.list_id) === paramListId
      );

      setTodos(filteredTodos);
    }

    if (!paramListId) {
      setTodos(allTodos ? [...allTodos.rows] : undefined);
    }

    if (search) {
      setSearch("");
    }
  }, [paramListId, allTodos?.rows]);

  useEffect(() => {
    if (!debouncedSearch) {
      if (paramListId) {
        const filteredTodos = allTodos?.rows.filter(
          (todo) => todo.list_id === paramListId
        );

        setTodos(filteredTodos);
      } else {
        setTodos(allTodos ? [...allTodos.rows] : undefined);
      }
    } else {
      searchTodos(debouncedSearch).then((results) => {
        setTodos(results);
      });
    }
  }, [debouncedSearch]);

  const list = lists?.rows.find(
    (list) => list.id === Number(params.get("listId"))
  );

  if (!todos) {
    return <NoTodos />;
  }

  return (
    <div className="pb-20">
      <div className="space-y-4">
        {allTodos && allTodos.rows?.length === 0 ? (
          <div className="fixed inset-0 flex items-center justify-center lg:ml-72 z-0">
            <Empty
              title="No todos"
              description="Add a todo to get started"
              button="Add Todo"
              onClick={() => setOpen(!open)}
            />
          </div>
        ) : (
          <Button
            onClick={() => setOpen(!open)}
            color="emerald"
            className="!fixed bottom-8 right-8 md:bottom-4 md:right-4 z-20"
          >
            <PlusIcon className="w-6 h-6" />
          </Button>
        )}

        <div className="flex items-center justify-between sticky top-0 left-0 bg-zinc-100 dark:bg-zinc-900 z-10 border-b border-zinc-200 dark:border-zinc-800 pb-2 !mt-0">
          <Heading level={2} className="flex items-start gap-2">
            {list ? list.name : "All Todos"}
            <Text>{todos?.length}</Text>
          </Heading>

          <div className="flex items-center gap-x-2">
            <Button
              onClick={() => {
                if (action === "search") {
                  setSearch("");
                  return setAction(undefined);
                }

                setAction("search");
              }}
              color={action === "search" ? "emerald" : "zinc"}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span className="sr-only">Search todos</span>
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {action === "search" && (
            <motion.div
              initial={{
                maxHeight: 0,
                opacity: 0,
              }}
              animate={{
                maxHeight: 300, // Set a reasonable max height for the animated container
                opacity: 1,
              }}
              exit={{
                maxHeight: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-2 overflow-hidden"
            >
              <Input
                value={search}
                autoFocus
                type="search"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search todos"
                className="w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {todos && todos?.length > 0 ? (
            <motion.ul
              variants={listVariant}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-2"
            >
              {todos
                .sort((a, b) => {
                  // First, sort by status ("todo" first)
                  if (a.status === "todo" && b.status === "done") return -1;
                  if (a.status === "done" && b.status === "todo") return 1;

                  // If statuses are the same, sort by id (ascending order)
                  return b.id - a.id;
                })
                .map((todo) => (
                  <motion.li
                    key={todo.id}
                    variants={itemVariant}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 pl-4 flex items-start justify-between bg-zinc-50 dark:bg-zinc-950 z-0"
                    layout
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-4 max-w-[95%]">
                        <Checkbox
                          checked={todo.status === "done"}
                          color={todo.status === "done" ? "emerald" : "zinc"}
                          onChange={() => {
                            if (todo.status === "todo") {
                              setStatusDone(todo.id);
                            } else {
                              setStatusTodo(todo.id);
                            }
                          }}
                          className="mt-[0.35rem]"
                        />

                        <Subheading
                          level={3}
                          className={clsx(
                            "mt-1 flex gap-2 !text-sm !font-normal",
                            todo.status === "done" &&
                              "line-through text-zinc-300 dark:text-zinc-700"
                          )}
                        >
                          <span>{todo.text}</span>
                        </Subheading>
                      </div>

                      {todo.list_id ? (
                        <Badge color="emerald" className="ml-7">
                          {lists?.rows.find((list) => list.id === todo.list_id)
                            ?.name ?? "Unknown"}
                        </Badge>
                      ) : null}
                    </div>

                    <Dropdown>
                      <DropdownButton plain>
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                      </DropdownButton>

                      <DropdownMenu>
                        {todo.status === "done" ? (
                          <DropdownItem onClick={() => setStatusTodo(todo.id)}>
                            <ListBulletIcon className="w-5 h-5" />
                            <span>Mark Todo</span>
                          </DropdownItem>
                        ) : (
                          <DropdownItem onClick={() => setStatusDone(todo.id)}>
                            <CheckIcon className="w-5 h-5" />
                            <span>Mark Done</span>
                          </DropdownItem>
                        )}

                        <DropdownItem
                          onClick={() => {
                            setListId(todo.list_id);
                            setTodo(todo.text);
                            setEditId(todo.id);
                          }}
                        >
                          <PencilIcon className="w-5 h-5" />
                          <span>Edit</span>
                        </DropdownItem>

                        <DropdownItem onClick={() => setDeleteId(todo.id)}>
                          <TrashIcon className="w-5 h-5" />
                          <span>Delete</span>
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </motion.li>
                ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>

      <Dialog
        open={open}
        onClose={() => {
          setTodo("");
          setListId(null);
          setOpen(false);
        }}
      >
        <DialogTitle>New Todo</DialogTitle>
        <DialogBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              insertTodo();
              setOpen(false);
            }}
            className="space-y-4"
          >
            <Field>
              <Label htmlFor="todo">Todo</Label>
              <Input
                id="todo"
                autoFocus
                value={todo}
                onChange={(e) => setTodo(e.target.value)}
              />
            </Field>

            <Field>
              <Label htmlFor="list">List</Label>
              <Select
                id="list"
                className="w-full mb-8"
                value={listId ?? ""}
                onChange={(e) => setListId(Number(e.target.value))}
              >
                <option value="">Select a list</option>
                {lists?.rows.map((list: any) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </Select>
            </Field>

            <DialogActions>
              <Button
                onClick={() => {
                  setTodo("");
                  setListId(null);
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" color="emerald">
                Add Todo
              </Button>
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Todo</DialogTitle>
        <DialogBody>
          <Text className="-mt-4 mb-8">
            Are you sure you want to delete this todo?
          </Text>
        </DialogBody>
        <DialogActions>
          <Button
            onClick={() => {
              setTodo("");
              setListId(null);
              setDeleteId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!deleteId) return;

              deleteTodo(deleteId);
              setDeleteId(null);
            }}
            color="red"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editId}
        onClose={() => {
          setTodo("");
          setListId(null);
          setEditId(null);
        }}
      >
        <DialogTitle>Edit Todo</DialogTitle>
        <DialogBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editId) return;

              updateTodo(editId, todo);
              setEditId(null);
            }}
            className="space-y-4"
          >
            <Field>
              <Label htmlFor="todo">Todo</Label>
              <Input
                id="todo"
                autoFocus
                value={todo}
                onChange={(e) => setTodo(e.target.value)}
                className="mb-8"
              />
            </Field>

            {lists && lists.rows.length > 0 ? (
              <Field>
                <Label htmlFor="list">List</Label>
                <Select
                  id="list"
                  className="w-full mb-8"
                  value={listId ?? ""}
                  onChange={(e) => setListId(Number(e.target.value))}
                >
                  <option value="">Select a list</option>
                  {lists?.rows.map((list: any) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            <DialogActions>
              <Button
                onClick={() => {
                  setTodo("");
                  setListId(null);
                  setEditId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" color="emerald">
                Update Todo
              </Button>
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>
    </div>
  );
}
