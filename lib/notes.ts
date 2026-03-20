import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  createdAt: Timestamp;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  workspaceId: string;
  parentId: string | null;
  tags: string[];
  isPinned?: boolean;
  pdfUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  transcript?: string;
  summary?: string;
  ocrText?: string;
  isVoice?: boolean;
  userId: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  workspaceId: string;
  userId: string;
  createdAt: Timestamp;
}

export const subscribeToWorkspaces = (userId: string, callback: (workspaces: Workspace[]) => void) => {
  const q = query(
    collection(db, "workspaces"),
    where("userId", "==", userId),
    orderBy("name", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const workspaces = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Workspace[];
    callback(workspaces);
  });
};

export const subscribeToNotes = (userId: string, workspaceId: string, callback: (notes: Note[]) => void) => {
  const q = query(
    collection(db, "notes"),
    where("userId", "==", userId),
    where("workspaceId", "==", workspaceId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
      };
    }) as Note[];
    callback(notes);
  });
};

export const subscribeToFolders = (userId: string, workspaceId: string, callback: (folders: Folder[]) => void) => {
  const q = query(
    collection(db, "folders"),
    where("userId", "==", userId),
    where("workspaceId", "==", workspaceId),
    orderBy("name", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Folder[];
    callback(folders);
  });
};

export const createWorkspace = async (userId: string, name: string) => {
  const newWorkspace = {
    name,
    userId,
    createdAt: serverTimestamp(),
  };
  return await addDoc(collection(db, "workspaces"), newWorkspace);
};

export const createNote = async (userId: string, workspaceId: string, folderId: string = "all") => {
  const newNote = {
    title: "",
    content: "",
    folderId,
    workspaceId,
    parentId: null,
    tags: [],
    isPinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userId,
  };
  return await addDoc(collection(db, "notes"), newNote);
};

export const updateNote = async (noteId: string, data: Partial<Note>) => {
  const noteRef = doc(db, "notes", noteId);
  return await updateDoc(noteRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteNote = async (noteId: string) => {
  return await deleteDoc(doc(db, "notes", noteId));
};

export const createFolder = async (userId: string, workspaceId: string, name: string, parentId: string | null = null) => {
  const newFolder = {
    name,
    workspaceId,
    parentId,
    userId,
    createdAt: serverTimestamp(),
  };
  return await addDoc(collection(db, "folders"), newFolder);
};

export const updateFolder = async (folderId: string, data: Partial<Folder>) => {
  const folderRef = doc(db, "folders", folderId);
  return await updateDoc(folderRef, data);
};

export const deleteFolder = async (folderId: string) => {
  return await deleteDoc(doc(db, "folders", folderId));
};

export const deleteWorkspace = async (workspaceId: string) => {
  return await deleteDoc(doc(db, "workspaces", workspaceId));
};

// --- Tag Management ---

export const subscribeToTags = (workspaceId: string, callback: (tags: string[]) => void) => {
  const q = query(
    collection(db, "notes"),
    where("workspaceId", "==", workspaceId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const allTags = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data() as Note;
      if (data.tags) {
        data.tags.forEach(tag => allTags.add(tag));
      }
    });
    callback(Array.from(allTags).sort());
  });
};

export const renameTag = async (workspaceId: string, oldTag: string, newTag: string) => {
  const q = query(
    collection(db, "notes"),
    where("workspaceId", "==", workspaceId),
    where("tags", "array-contains", oldTag)
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data() as Note;
    const updatedTags = data.tags?.map(t => t === oldTag ? newTag : t) || [];
    batch.update(doc.ref, { 
      tags: updatedTags,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};

export const deleteTag = async (workspaceId: string, tagToDelete: string) => {
  const q = query(
    collection(db, "notes"),
    where("workspaceId", "==", workspaceId),
    where("tags", "array-contains", tagToDelete)
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data() as Note;
    const updatedTags = data.tags?.filter(t => t !== tagToDelete) || [];
    batch.update(doc.ref, { 
      tags: updatedTags,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};
