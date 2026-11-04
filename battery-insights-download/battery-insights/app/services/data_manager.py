"""Armazenamento em memória do dataset ativo (adequado para execução local/demonstração)."""
class DataManager:
    def __init__(self):
        self._data = None
        self.filename = None
        self.generation = 0

    def set_data(self, dataframe, filename):
        self._data = dataframe.copy()
        self.filename = filename
        self.generation += 1

    def get_data(self):
        if self._data is None:
            raise ValueError("Nenhuma base carregada. Faça upload de um arquivo primeiro.")
        return self._data.copy()

    def status(self):
        if self._data is None:
            return {"loaded": False, "filename": None, "rows": 0, "columns": []}
        return {"loaded": True, "filename": self.filename, "rows": len(self._data), "columns": list(self._data.columns), "generation": self.generation}

data_manager = DataManager()
