
const fs = require('fs');
const path = 'app-wrapper.tsx';

try {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Remove RepartoTab and FinalizadosTab
    // Find start of RepartoTab
    const repartoStart = content.indexOf('// Componente: RepartoTab - Gestión de pedidos en etapa de reparto');
    if (repartoStart === -1) console.log('RepartoTab start not found');

    // Find start of PlaceholderTab (which comes after FinalizadosTab)
    const placeholderStart = content.indexOf('// Componentes Placeholder para otras pestañas y matrices');
    if (placeholderStart === -1) console.log('PlaceholderTab start not found');

    if (repartoStart !== -1 && placeholderStart !== -1) {
        console.log(`Deleting from ${repartoStart} to ${placeholderStart}`);
        content = content.slice(0, repartoStart) + content.slice(placeholderStart);
    }

    // 2. Remove Duplicated Constants
    const constantsStart = content.indexOf('const peruGeoData = [');
    const constantsEndMarker = 'export const MATRIZ_COMPOSICION'; // End of pasted constants block usually
    // Or finding "const AuthContext" start?

    // Actually, let's look for known pattern of constants block
    // It starts with peruGeoData and ends before AuthContext

    const authContextStart = content.indexOf('// Contexto de Autenticación con Sistema de Permisos');

    if (constantsStart !== -1 && authContextStart !== -1) {
        console.log(`Deleting constants from ${constantsStart} to ${authContextStart}`);
        // Check if we are deleting too much
        if (authContextStart > constantsStart) {
            content = content.slice(0, constantsStart) + content.slice(authContextStart);
        }
    }

    // 3. Remove AuthContext and AuthProvider
    const authProviderStart = content.indexOf('// Contexto de Autenticación con Sistema de Permisos');

    // We want to keep useAuth definition IF it was just importing? 
    // No, the local useAuth definitions were: 
    // const AuthContext = ...
    // export function AuthProvider ...
    // export const useAuth ...

    // We want to delete ALL of that and import them.
    // The block ends where? 
    // "const peruGeoData" is actually AFTER imports but BEFORE AuthContext in original file?
    // Wait, looking at file structure:
    // Imports
    // Constants (duplicate)
    // AuthContext
    // AuthProvider
    // useAuth
    // peruGeoData (duplicate again??)

    // Let's use specific removal for AuthProvider block.
    // Starts with "const AuthContext = createContext"
    // Ends with "const useAuth = () => {" ... block end

    // Easier: Remove regex for the AuthProvider function and AuthContext

    // Remove AuthContext definition
    content = content.replace(/const AuthContext = createContext<any>\(null\)/g, '');

    // Remove AuthProvider function
    // It spans many lines. regex might fail.
    // Let's find start and end indices.

    const authProviderFnStart = content.indexOf('export function AuthProvider({ children }');
    if (authProviderFnStart !== -1) {
        // Find matching closing brace is hard without parser.
        // But we know it ends before useAuth?
        const useAuthStart = content.indexOf('export const useAuth = () => {');
        if (useAuthStart !== -1) {
            content = content.slice(0, authProviderFnStart) + content.slice(useAuthStart);
        }
    }

    // Remove useAuth definition
    const useAuthFnStart = content.indexOf('export const useAuth = () => {');
    if (useAuthFnStart !== -1) {
        // Ends at the end of the file part or before next component?
        // It ends before "const peruGeoData" (if that comes after) or "const productOptions"

        // Let's just strip the local useAuth if we import it.
        // Find the end of useAuth block?
        // It returns context as any.
        // It's followed by...
        // "// Datos de ejemplo" line 381

        const datosEjemplo = content.indexOf('// Datos de ejemplo');
        if (datosEjemplo !== -1 && datosEjemplo > useAuthFnStart) {
            content = content.slice(0, useAuthFnStart) + content.slice(datosEjemplo);
        }
    }

    // 4. Add Imports
    const importMarker = 'import { DndContext'; // Anchor
    const newImports = `
import { RepartoTab } from "@/components/tabs/reparto-tab"
import { FinalizadosTab } from "@/components/tabs/finalizados-tab"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { peruGeoData, productLines, salesChannels, vendedores, activadores, horarios, repartidores, productOptions, garmentDetails, shippingAgencies, disenadores, operadoresPreEstampado, estampadores, operadoresEmpaquetado, tiposDocumento, regalosList, initialTiposDePrendaInventario, initialColoresInventario, initialTallasInventario, motivosAjusteStock, ROLES_TABS, CONFECCION_TABS, BASE_DATOS_TABS, INVENTARIOS_TABS, COLOR_PALETTE, AVAILABLE_MODULES, TIPOS_CONDICIONES, AVAILABLE_ICONS } from "@/lib/constants"
`;

    if (content.indexOf(importMarker) !== -1) {
        content = content.replace(importMarker, newImports + '\n' + importMarker);
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Cleanup complete');

} catch (err) {
    console.error(err);
}
