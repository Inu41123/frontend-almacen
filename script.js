// ====================================================
// ¡¡IMPORTANTE!! Usa tu URL de localhost para probar
// ====================================================
const API_URL = 'http://localhost:3000/productos';

// --- Referencias del DOM ---
const formProducto = document.getElementById('form-producto');
const tablaProductos = document.getElementById('tabla-productos');
const imgPreview = document.getElementById('img-preview');
const inputImagen = document.getElementById('imagen');

// Referencias de Filtros
const filtroNombre = document.getElementById('filtro-nombre');
const filtroCategoria = document.getElementById('filtro-categoria');

// Referencias del Modal de Edición
const modalEditar = new bootstrap.Modal(document.getElementById('modal-editar'));
const formEditar = document.getElementById('form-editar');
const btnGuardarCambios = document.getElementById('btn-guardar-cambios');

// Almacén global para los productos (para los filtros)
let todosLosProductos = [];


// --- (NUEVO) Validación de Bootstrap ---
// Deshabilita el envío si el formulario no es válido
(function () {
    'use strict';
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
})();

// --- (NUEVO) Previsualización de Imagen ---
inputImagen.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imgPreview.src = event.target.result;
            imgPreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        imgPreview.src = '';
        imgPreview.style.display = 'none';
    }
});

// --- (NUEVO) Filtros ---
filtroNombre.addEventListener('input', () => pintarTabla(todosLosProductos));
filtroCategoria.addEventListener('change', () => pintarTabla(todosLosProductos));

function aplicarFiltros(productos) {
    const texto = filtroNombre.value.toLowerCase();
    const categoria = filtroCategoria.value;

    return productos.filter(prod => {
        const nombreMatch = prod.nombre.toLowerCase().includes(texto);
        const categoriaMatch = (categoria === 'todos' || prod.category === categoria);
        return nombreMatch && categoriaMatch;
    });
}

// --- (MODIFICADO) Pintar la Tabla ---
// Se separa la lógica de pintar para poder usarla con los filtros
function pintarTabla(productos) {
    tablaProductos.innerHTML = ''; // Limpiar la tabla

    const productosFiltrados = aplicarFiltros(productos);

    if (productosFiltrados.length === 0) {
        tablaProductos.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron productos.</td></tr>';
        return;
    }

    productosFiltrados.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${prod.imageUrl}" alt="${prod.nombre}" width="75" class="img-thumbnail">
            </td>
            <td>${prod.nombre}</td>
            <td><span class="badge bg-secondary">${prod.category}</span></td>
            <td>${prod.stock}</td>
            <td>
                <button class="btn btn-warning btn-sm" 
                    onclick="abrirModalEditar('${prod._id}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" 
                    onclick="borrarProducto('${prod._id}')">
                    Borrar
                </button>
            </td>
        `;
        tablaProductos.appendChild(tr);
    });
}

// --- READ (Cargar productos de la API) ---
async function cargarProductos() {
    try {
        const respuesta = await fetch(API_URL);
        todosLosProductos = await respuesta.json(); // Guardamos en el almacén global
        
        if (!respuesta.ok) throw new Error('Error al cargar productos');
        
        pintarTabla(todosLosProductos); // Pintamos usando el almacén

    } catch (error) {
        console.error('Error al cargar productos:', error);
        tablaProductos.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos.</td></tr>';
    }
}

// --- CREATE (Manejar el envío del formulario) ---
formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Re-chequea la validación de Bootstrap
    if (!formProducto.checkValidity()) {
        formProducto.classList.add('was-validated');
        return;
    }

    const formData = new FormData(formProducto);
    
    // (Opcional) Deshabilita el botón para evitar doble click
    const btnSubmit = formProducto.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Guardando...';

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            body: formData 
        });

        const nuevoProducto = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(nuevoProducto.mensaje || 'Error al crear el producto');
        }

        console.log('Producto creado:', nuevoProducto);

        // Limpiamos todo
        formProducto.reset();
        formProducto.classList.remove('was-validated');
        imgPreview.style.display = 'none';
        
        cargarProductos(); // Recargamos la tabla

    } catch (error) {
        console.error('Error al crear producto:', error);
        alert('Error al crear producto: ' + error.message);
    } finally {
        // Vuelve a habilitar el botón
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Guardar Producto';
    }
});

// --- (NUEVO) DELETE (Borrar un producto) ---
async function borrarProducto(id) {
    if (!confirm('¿Seguro que quieres borrar este producto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.mensaje || 'Error al borrar');
        }

        console.log(data.mensaje);
        cargarProductos(); // Recargamos la tabla

    } catch (error) {
        console.error('Error al borrar:', error);
        alert('Error al borrar: ' + error.message);
    }
}

// --- (NUEVO) UPDATE (Abrir y manejar el Modal de Edición) ---

// 1. Abrir el modal y rellenar los campos
function abrirModalEditar(id) {
    // Buscar el producto en nuestro almacén global
    const producto = todosLosProductos.find(p => p._id === id);
    if (!producto) return;

    // Rellenar el formulario del modal
    document.getElementById('edit-id').value = producto._id;
    document.getElementById('edit-nombre').value = producto.nombre;
    document.getElementById('edit-descripcion').value = producto.descripcion;
    document.getElementById('edit-stock').value = producto.stock;
    document.getElementById('edit-category').value = producto.category;
    document.getElementById('edit-imagen').value = ''; // Limpiar el input de imagen

    // Mostrar el modal
    modalEditar.show();
}

// 2. Escuchar el clic en el botón "Guardar Cambios" del modal
btnGuardarCambios.addEventListener('click', async () => {
    
    // Creamos un FormData a partir del formulario de EDICIÓN
    const formData = new FormData(formEditar);
    const id = formData.get('id');

    // (Opcional) Deshabilita el botón
    btnGuardarCambios.disabled = true;
    btnGuardarCambios.innerText = 'Guardando...';

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            body: formData // Mandamos el FormData (la API sabrá si viene imagen o no)
        });

        const productoActualizado = await respuesta.json();
        
        if (!respuesta.ok) {
            throw new Error(productoActualizado.mensaje || 'Error al actualizar');
        }

        console.log('Producto actualizado:', productoActualizado);
        
        modalEditar.hide(); // Ocultamos el modal
        cargarProductos(); // Recargamos la tabla

    } catch (error) {
        console.error('Error al actualizar:', error);
        alert('Error al actualizar: ' + error.message);
    } finally {
        // Vuelve a habilitar el botón
        btnGuardarCambios.disabled = false;
        btnGuardarCambios.innerText = 'Guardar Cambios';
    }
});


// --- ¡Arrancamos! ---
// Carga los productos cuando la página se abre por primera vez
cargarProductos();