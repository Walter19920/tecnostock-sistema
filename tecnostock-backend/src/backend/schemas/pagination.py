"""
schemas/pagination.py
Schema genérico de paginación reutilizable en todos los endpoints paginados.
"""
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginacionResponse(BaseModel, Generic[T]):
    """
    Respuesta estándar para endpoints con paginación.

    Attributes:
        items:           Lista de elementos de la página actual.
        pagina:          Número de página actual (base 1).
        tamanio_pagina:  Cantidad de elementos por página.
        total_registros: Total de registros que coinciden con el filtro.
        total_paginas:   Total de páginas calculado en la capa de services.
    """
    items: list[T]
    pagina: int
    tamanio_pagina: int
    total_registros: int
    total_paginas: int
