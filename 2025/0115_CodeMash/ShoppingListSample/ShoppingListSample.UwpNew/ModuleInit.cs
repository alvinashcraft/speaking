using System;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using WinRT;

namespace ShoppingListSample.UwpNew
{
    static class ModuleInit
    {
        private static ComWrappers.ComInterfaceEntry[] LookupVtableEntries(Type type)
        {
            if (type.ToString() == "System.Collections.ObjectModel.ObservableCollection`1[ShoppingListSample.Shared.Item]") 
            {
                return
                    [
                    new ComWrappers.ComInterfaceEntry
                    { 
                        IID = ABI.System.Collections.Specialized.INotifyCollectionChangedMethods.IID,
                        Vtable = ABI.System.Collections.Specialized.INotifyCollectionChangedMethods.AbiToProjectionVftablePtr
                    }, 
                    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.Generic.IReadOnlyListMethods<Shared.Item>.IID,
                        Vtable = ABI.System.Collections.Generic.IReadOnlyListMethods<Shared.Item>.AbiToProjectionVftablePtr
                    },
                    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.Generic.IEnumerableMethods<Shared.Item>.IID,
                        Vtable = ABI.System.Collections.Generic.IEnumerableMethods<Shared.Item>.AbiToProjectionVftablePtr
                    },
                    new ComWrappers.ComInterfaceEntry 
                    {
                        IID = ABI.System.Collections.IEnumerableMethods.IID,
                        Vtable = ABI.System.Collections.IEnumerableMethods.AbiToProjectionVftablePtr },
                    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.IListMethods.IID,
                        Vtable = ABI.System.Collections.IListMethods.AbiToProjectionVftablePtr 
                    },
                ];
            }
            else if (type.ToString() == "System.Collections.ObjectModel.ObservableCollection`1[ShoppingListSample.Shared.Category]")
            {
                return
    [
    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.Specialized.INotifyCollectionChangedMethods.IID,
                        Vtable = ABI.System.Collections.Specialized.INotifyCollectionChangedMethods.AbiToProjectionVftablePtr
                    },
                    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.Generic.IReadOnlyListMethods<Shared.Category>.IID,
                        Vtable = ABI.System.Collections.Generic.IReadOnlyListMethods<Shared.Category>.AbiToProjectionVftablePtr
                    },
                    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.Generic.IEnumerableMethods<Shared.Category>.IID,
                        Vtable = ABI.System.Collections.Generic.IEnumerableMethods<Shared.Category>.AbiToProjectionVftablePtr
                    },
                    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.IEnumerableMethods.IID,
                        Vtable = ABI.System.Collections.IEnumerableMethods.AbiToProjectionVftablePtr },
                    new ComWrappers.ComInterfaceEntry
                    {
                        IID = ABI.System.Collections.IListMethods.IID,
                        Vtable = ABI.System.Collections.IListMethods.AbiToProjectionVftablePtr
                    },
                ];
            }
            return default;
        }
        
        private static string LookupRuntimeClassName(Type type)
        {
            if (type.ToString() == "System.Collections.ObjectModel.ObservableCollection`1[ShoppingListSample.Shared.Item]")
            {
                return "Windows.Foundation.Collections.IVectorView`1<ShoppingListSample.Shared.Item>";
            }
            else if (type.ToString() == "System.Collections.ObjectModel.ObservableCollection`1[ShoppingListSample.Shared.Category]")
            {
                return "Windows.Foundation.Collections.IVectorView`1<ShoppingListSample.Shared.Category>";
            }

            return default;
        }
        
        [ModuleInitializer] 
        internal static void Initialize()
        {
            ComWrappersSupport.RegisterTypeComInterfaceEntriesLookup(LookupVtableEntries);
            ComWrappersSupport.RegisterTypeRuntimeClassNameLookup(LookupRuntimeClassName);
        }
    }
}
