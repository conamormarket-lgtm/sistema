
// Helper auxiliar para formateo estricto de dinero (x,xxx.xx)
// Se define fuera para garantizar acceso global
const formatMoneyStrict = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "0.00"
    return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
